using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;

namespace LeccomLauncher
{
    internal sealed class DataStore
    {
        private const int MaxBackups = 30;
        private static readonly object SyncRoot = new object();
        private readonly JavaScriptSerializer serializer = new JavaScriptSerializer();

        public static string DataDirectory
        {
            get
            {
                return Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "LECCOM Schedule Builder");
            }
        }

        private static string DataFile
        {
            get { return Path.Combine(DataDirectory, "data.json"); }
        }

        private static string BackupDirectory
        {
            get { return Path.Combine(DataDirectory, "backups"); }
        }

        public static void EnsureDirectories()
        {
            Directory.CreateDirectory(DataDirectory);
            Directory.CreateDirectory(BackupDirectory);
        }

        public byte[] Read()
        {
            lock (SyncRoot)
            {
                if (!File.Exists(DataFile)) return null;
                return File.ReadAllBytes(DataFile);
            }
        }

        public void Write(byte[] body)
        {
            if (body == null || body.Length == 0)
            {
                throw new ArgumentException("The schedule data is empty.");
            }

            Validate(body);

            lock (SyncRoot)
            {
                EnsureDirectories();
                BackupIfNeeded();

                var temp = DataFile + ".tmp-" + Guid.NewGuid().ToString("N");
                File.WriteAllBytes(temp, body);
                try
                {
                    if (File.Exists(DataFile))
                    {
                        File.Replace(temp, DataFile, null);
                    }
                    else
                    {
                        File.Move(temp, DataFile);
                    }
                }
                catch
                {
                    File.Copy(temp, DataFile, true);
                    TryDelete(temp);
                }
            }
        }

        private void Validate(byte[] body)
        {
            string json;
            try
            {
                json = Encoding.UTF8.GetString(body);
            }
            catch (Exception error)
            {
                throw new ArgumentException("The schedule data is not valid UTF-8.", error);
            }

            object parsed;
            try
            {
                parsed = serializer.DeserializeObject(json);
            }
            catch (Exception error)
            {
                throw new ArgumentException("The schedule data is not valid JSON.", error);
            }

            var dictionary = parsed as Dictionary<string, object>;
            if (dictionary == null)
            {
                throw new ArgumentException("The schedule data must be a JSON object.");
            }
            if (!dictionary.ContainsKey("months") || !dictionary.ContainsKey("roster"))
            {
                throw new ArgumentException("The schedule data is missing required fields.");
            }
        }

        private static void BackupIfNeeded()
        {
            if (!File.Exists(DataFile)) return;

            var backup = Path.Combine(
                BackupDirectory,
                "data-" + DateTime.Now.ToString("yyyyMMdd") + ".json");
            if (!File.Exists(backup))
            {
                File.Copy(DataFile, backup);
            }

            var files = Directory.GetFiles(BackupDirectory, "data-*.json");
            Array.Sort(files, StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < files.Length - MaxBackups; index++)
            {
                TryDelete(files[index]);
            }
        }

        private static void TryDelete(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch
            {
            }
        }
    }
}
