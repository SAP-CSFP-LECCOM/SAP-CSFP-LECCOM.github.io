using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Reflection;

namespace LeccomLauncher
{
    internal sealed class AssetStore
    {
        private const string ResourceName = "LECCOM.assets.zip";
        private readonly Dictionary<string, byte[]> assets =
            new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);

        private AssetStore()
        {
        }

        public static AssetStore Load()
        {
            var store = new AssetStore();
            var assembly = Assembly.GetExecutingAssembly();
            using (var resource = assembly.GetManifestResourceStream(ResourceName))
            {
                if (resource == null)
                {
                    throw new InvalidOperationException("The embedded app assets were not found.");
                }

                using (var archive = new ZipArchive(resource, ZipArchiveMode.Read, false))
                {
                    foreach (var entry in archive.Entries)
                    {
                        if (entry.FullName.EndsWith("/", StringComparison.Ordinal)) continue;
                        if (entry.Length > 20 * 1024 * 1024) continue;

                        using (var input = entry.Open())
                        using (var output = new MemoryStream())
                        {
                            input.CopyTo(output);
                            store.assets[NormalizePath(entry.FullName)] = output.ToArray();
                        }
                    }
                }
            }

            if (!store.assets.ContainsKey("index.html"))
            {
                throw new InvalidOperationException("The embedded app is missing index.html.");
            }
            return store;
        }

        public bool TryGet(string path, out byte[] data, out string contentType)
        {
            var key = NormalizePath(path);
            if (assets.TryGetValue(key, out data))
            {
                contentType = ContentTypeFor(key);
                return true;
            }

            if (assets.TryGetValue("index.html", out data))
            {
                contentType = "text/html; charset=utf-8";
                return true;
            }

            contentType = "text/plain; charset=utf-8";
            return false;
        }

        public static string NormalizePath(string path)
        {
            if (string.IsNullOrEmpty(path)) return "index.html";

            path = path.Replace('\\', '/');
            var query = path.IndexOf('?');
            if (query >= 0) path = path.Substring(0, query);
            path = path.TrimStart('/');

            var parts = path.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            var stack = new List<string>();
            foreach (var part in parts)
            {
                if (part == ".") continue;
                if (part == "..")
                {
                    if (stack.Count > 0) stack.RemoveAt(stack.Count - 1);
                    continue;
                }
                stack.Add(part);
            }

            var normalized = string.Join("/", stack.ToArray());
            return normalized.Length == 0 ? "index.html" : normalized;
        }

        private static string ContentTypeFor(string path)
        {
            var extension = Path.GetExtension(path).ToLowerInvariant();
            switch (extension)
            {
                case ".html":
                case ".htm":
                    return "text/html; charset=utf-8";
                case ".js":
                case ".mjs":
                    return "text/javascript; charset=utf-8";
                case ".css":
                    return "text/css; charset=utf-8";
                case ".json":
                    return "application/json; charset=utf-8";
                case ".jpeg":
                case ".jpg":
                    return "image/jpeg";
                case ".png":
                    return "image/png";
                case ".svg":
                    return "image/svg+xml";
                case ".ico":
                    return "image/x-icon";
                case ".woff":
                    return "font/woff";
                case ".woff2":
                    return "font/woff2";
                default:
                    return "application/octet-stream";
            }
        }
    }
}
