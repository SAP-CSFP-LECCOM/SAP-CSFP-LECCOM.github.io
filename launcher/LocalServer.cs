using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace LeccomLauncher
{
    internal sealed class LocalServer
    {
        private const int MaxHeaderBytes = 64 * 1024;
        private const int MaxBodyBytes = 5 * 1024 * 1024;

        private readonly AssetStore assets;
        private readonly DataStore dataStore;
        private readonly int startPort;
        private readonly int endPort;
        private readonly List<TcpListener> listeners = new List<TcpListener>();
        private readonly List<Thread> acceptThreads = new List<Thread>();
        private volatile bool stopping;
        private int port;

        public LocalServer(AssetStore assets, DataStore dataStore, int startPort, int endPort)
        {
            this.assets = assets;
            this.dataStore = dataStore;
            this.startPort = startPort;
            this.endPort = endPort;
        }

        public int Port
        {
            get { return port; }
        }

        public void Start()
        {
            for (var candidate = startPort; candidate <= endPort; candidate++)
            {
                var candidateListeners = new List<TcpListener>();
                try
                {
                    var ipv4 = new TcpListener(IPAddress.Loopback, candidate);
                    ipv4.Start();
                    candidateListeners.Add(ipv4);

                    if (Socket.OSSupportsIPv6)
                    {
                        var ipv6 = new TcpListener(IPAddress.IPv6Loopback, candidate);
                        ipv6.Start();
                        candidateListeners.Add(ipv6);
                    }

                    listeners.AddRange(candidateListeners);
                    port = candidate;
                    break;
                }
                catch (SocketException)
                {
                    for (var index = 0; index < candidateListeners.Count; index++)
                    {
                        try
                        {
                            candidateListeners[index].Stop();
                        }
                        catch
                        {
                        }
                    }
                    candidateListeners.Clear();
                }
            }

            if (listeners.Count == 0)
            {
                throw new InvalidOperationException(
                    "No local port is available between " + startPort + " and " + endPort + ".");
            }

            for (var index = 0; index < listeners.Count; index++)
            {
                var thread = new Thread(AcceptLoop);
                thread.IsBackground = true;
                thread.Name = "LECCOM local server";
                thread.Start(listeners[index]);
                acceptThreads.Add(thread);
            }
        }

        public void Stop()
        {
            stopping = true;
            for (var index = 0; index < listeners.Count; index++)
            {
                try
                {
                    listeners[index].Stop();
                }
                catch
                {
                }
            }
            for (var index = 0; index < acceptThreads.Count; index++)
            {
                try
                {
                    acceptThreads[index].Join(1000);
                }
                catch
                {
                }
            }
        }

        private void AcceptLoop(object state)
        {
            var listener = (TcpListener)state;
            while (!stopping)
            {
                TcpClient client = null;
                try
                {
                    client = listener.AcceptTcpClient();
                }
                catch
                {
                    if (stopping) break;
                    continue;
                }

                ThreadPool.QueueUserWorkItem(HandleClient, client);
            }
        }

        private void HandleClient(object state)
        {
            var client = state as TcpClient;
            if (client == null) return;

            try
            {
                client.NoDelay = true;
                client.ReceiveTimeout = 15000;
                client.SendTimeout = 15000;

                using (client)
                using (var stream = client.GetStream())
                {
                    var request = ReadRequest(stream);
                    if (request == null) return;
                    Route(stream, request);
                }
            }
            catch (IOException)
            {
            }
            catch (SocketException)
            {
            }
            catch (ObjectDisposedException)
            {
            }
            catch (Exception)
            {
                try
                {
                    using (client)
                    using (var stream = client.GetStream())
                    {
                        WriteText(stream, 500, "Internal Server Error", "Internal server error.", false);
                    }
                }
                catch
                {
                }
            }
        }

        private void Route(NetworkStream stream, HttpRequest request)
        {
            var path = request.Path;
            if (path.Length > 1 && path.EndsWith("/", StringComparison.Ordinal))
            {
                path = path.Substring(0, path.Length - 1);
            }

            if (string.Equals(path, "/api/health", StringComparison.OrdinalIgnoreCase))
            {
                if (!IsGetOrHead(request.Method))
                {
                    WriteText(stream, 405, "Method Not Allowed", "Method not allowed.", IsHead(request.Method));
                    return;
                }

                WriteJsonText(stream, 200, "{\"ok\":true,\"version\":\"1.0.0\"}", IsHead(request.Method));
                return;
            }

            if (string.Equals(path, "/api/data", StringComparison.OrdinalIgnoreCase))
            {
                HandleDataApi(stream, request);
                return;
            }

            if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            {
                WriteText(stream, 404, "Not Found", "Not found.", IsHead(request.Method));
                return;
            }

            if (!IsGetOrHead(request.Method))
            {
                WriteText(stream, 405, "Method Not Allowed", "Method not allowed.", IsHead(request.Method));
                return;
            }

            var assetPath = path == "/" ? "index.html" : path.TrimStart('/');
            byte[] data;
            string contentType;
            if (!assets.TryGet(assetPath, out data, out contentType))
            {
                WriteText(stream, 404, "Not Found", "Not found.", IsHead(request.Method));
                return;
            }

            var cache = assetPath == "index.html" ? "no-store" : "public, max-age=3600";
            WriteResponse(stream, 200, "OK", data, contentType, IsHead(request.Method), cache);
        }

        private void HandleDataApi(NetworkStream stream, HttpRequest request)
        {
            if (IsGetOrHead(request.Method))
            {
                var data = dataStore.Read();
                if (data == null)
                {
                    WriteEmpty(stream, 204, "No Content", IsHead(request.Method));
                    return;
                }

                WriteResponse(
                    stream,
                    200,
                    "OK",
                    data,
                    "application/json; charset=utf-8",
                    IsHead(request.Method),
                    "no-store");
                return;
            }

            if (string.Equals(request.Method, "PUT", StringComparison.OrdinalIgnoreCase))
            {
                if (request.Body == null || request.Body.Length == 0)
                {
                    WriteText(stream, 400, "Bad Request", "Missing request body.", false);
                    return;
                }

                try
                {
                    dataStore.Write(request.Body);
                }
                catch (ArgumentException error)
                {
                    WriteText(stream, 400, "Bad Request", error.Message, false);
                    return;
                }
                catch (Exception error)
                {
                    WriteText(stream, 500, "Internal Server Error", error.Message, false);
                    return;
                }

                WriteEmpty(stream, 204, "No Content", false);
                return;
            }

            WriteText(stream, 405, "Method Not Allowed", "Method not allowed.", false);
        }

        private static bool IsGetOrHead(string method)
        {
            return string.Equals(method, "GET", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsHead(string method)
        {
            return string.Equals(method, "HEAD", StringComparison.OrdinalIgnoreCase);
        }

        private static HttpRequest ReadRequest(NetworkStream stream)
        {
            var buffer = new byte[8192];
            var received = new List<byte>();
            var headerEnd = -1;

            while (headerEnd < 0)
            {
                var read = stream.Read(buffer, 0, buffer.Length);
                if (read <= 0) return null;
                for (var index = 0; index < read; index++) received.Add(buffer[index]);
                if (received.Count > MaxHeaderBytes)
                {
                    throw new InvalidDataException("Request headers are too large.");
                }
                headerEnd = FindHeaderEnd(received);
            }

            var headerBytes = received.GetRange(0, headerEnd).ToArray();
            var headerText = Encoding.ASCII.GetString(headerBytes);
            var lines = headerText.Split(new[] { "\r\n" }, StringSplitOptions.None);
            if (lines.Length == 0) return null;

            var requestLine = lines[0].Split(' ');
            if (requestLine.Length < 2) return null;

            var request = new HttpRequest();
            request.Method = requestLine[0];
            request.RawUrl = requestLine[1];
            request.Path = ParsePath(request.RawUrl);

            for (var index = 1; index < lines.Length; index++)
            {
                var line = lines[index];
                var colon = line.IndexOf(':');
                if (colon <= 0) continue;
                var name = line.Substring(0, colon).Trim();
                var value = line.Substring(colon + 1).Trim();
                request.Headers[name] = value;
            }

            var contentLength = 0;
            var contentLengthValue = request.Header("Content-Length");
            if (!string.IsNullOrEmpty(contentLengthValue))
            {
                int parsed;
                if (!int.TryParse(contentLengthValue, out parsed) || parsed < 0)
                {
                    throw new InvalidDataException("Invalid Content-Length.");
                }
                contentLength = parsed;
            }

            if (contentLength > MaxBodyBytes)
            {
                throw new InvalidDataException("Request body is too large.");
            }

            var expect = request.Header("Expect");
            if (!string.IsNullOrEmpty(expect) &&
                expect.IndexOf("100-continue", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                var continueBytes = Encoding.ASCII.GetBytes("HTTP/1.1 100 Continue\r\n\r\n");
                stream.Write(continueBytes, 0, continueBytes.Length);
                stream.Flush();
            }

            using (var body = new MemoryStream())
            {
                var prefixStart = headerEnd + 4;
                var prefixCount = received.Count - prefixStart;
                if (prefixCount > 0)
                {
                    body.Write(received.GetRange(prefixStart, prefixCount).ToArray(), 0, prefixCount);
                }

                var remaining = contentLength - prefixCount;
                while (remaining > 0)
                {
                    var read = stream.Read(buffer, 0, Math.Min(buffer.Length, remaining));
                    if (read <= 0) throw new InvalidDataException("Request body ended early.");
                    body.Write(buffer, 0, read);
                    remaining -= read;
                }

                request.Body = body.ToArray();
            }
            return request;
        }

        private static int FindHeaderEnd(List<byte> bytes)
        {
            for (var index = 3; index < bytes.Count; index++)
            {
                if (bytes[index - 3] == 13 &&
                    bytes[index - 2] == 10 &&
                    bytes[index - 1] == 13 &&
                    bytes[index] == 10)
                {
                    return index - 3;
                }
            }
            return -1;
        }

        private static string ParsePath(string rawUrl)
        {
            if (string.IsNullOrEmpty(rawUrl)) return "/";

            var path = rawUrl;
            if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                Uri uri;
                if (Uri.TryCreate(path, UriKind.Absolute, out uri)) path = uri.AbsolutePath;
            }

            var query = path.IndexOf('?');
            if (query >= 0) path = path.Substring(0, query);
            if (!path.StartsWith("/", StringComparison.Ordinal)) path = "/" + path;

            try
            {
                path = Uri.UnescapeDataString(path);
            }
            catch
            {
            }

            return path.Replace('\\', '/');
        }

        private static void WriteJsonText(NetworkStream stream, int status, string json, bool head)
        {
            WriteResponse(
                stream,
                status,
                Reason(status),
                Encoding.UTF8.GetBytes(json),
                "application/json; charset=utf-8",
                head,
                "no-store");
        }

        private static void WriteText(
            NetworkStream stream,
            int status,
            string reason,
            string text,
            bool head)
        {
            WriteResponse(
                stream,
                status,
                reason,
                Encoding.UTF8.GetBytes(text),
                "text/plain; charset=utf-8",
                head,
                "no-store");
        }

        private static void WriteEmpty(NetworkStream stream, int status, string reason, bool head)
        {
            WriteResponse(stream, status, reason, new byte[0], "text/plain; charset=utf-8", head, "no-store");
        }

        private static void WriteResponse(
            NetworkStream stream,
            int status,
            string reason,
            byte[] body,
            string contentType,
            bool head,
            string cacheControl)
        {
            var builder = new StringBuilder();
            builder.Append("HTTP/1.1 ").Append(status).Append(' ').Append(reason).Append("\r\n");
            builder.Append("Content-Type: ").Append(contentType).Append("\r\n");
            builder.Append("Content-Length: ").Append(body == null ? 0 : body.Length).Append("\r\n");
            builder.Append("Cache-Control: ").Append(cacheControl).Append("\r\n");
            builder.Append("X-Content-Type-Options: nosniff\r\n");
            builder.Append("Connection: close\r\n\r\n");

            var header = Encoding.ASCII.GetBytes(builder.ToString());
            stream.Write(header, 0, header.Length);
            if (!head && body != null && body.Length > 0)
            {
                stream.Write(body, 0, body.Length);
            }
            stream.Flush();
        }

        private static string Reason(int status)
        {
            switch (status)
            {
                case 200: return "OK";
                case 204: return "No Content";
                case 400: return "Bad Request";
                case 404: return "Not Found";
                case 405: return "Method Not Allowed";
                case 413: return "Payload Too Large";
                default: return "Internal Server Error";
            }
        }

        private sealed class HttpRequest
        {
            public HttpRequest()
            {
                Headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                Body = new byte[0];
            }

            public string Method { get; set; }
            public string RawUrl { get; set; }
            public string Path { get; set; }
            public byte[] Body { get; set; }
            public Dictionary<string, string> Headers { get; private set; }

            public string Header(string name)
            {
                string value;
                return Headers.TryGetValue(name, out value) ? value : null;
            }
        }
    }
}
