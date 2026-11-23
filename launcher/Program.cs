using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;

namespace LeccomLauncher
{
    internal static class Program
    {
        private const string MutexName = @"Local\LECCOM_Schedule_Builder_Launcher";

        [STAThread]
        private static void Main()
        {
            bool createdNew;
            using (var mutex = new Mutex(true, MutexName, out createdNew))
            {
                if (!createdNew)
                {
                    OpenExistingInstance();
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                try
                {
                    Application.Run(new TrayContext());
                }
                catch (Exception error)
                {
                    MessageBox.Show(
                        "LECCOM Schedule Builder could not start.\n\n" + error.Message,
                        "LECCOM Schedule Builder",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                }
            }
        }

        private static void OpenExistingInstance()
        {
            var url = RuntimeInfo.ReadUrl();
            if (string.IsNullOrEmpty(url)) url = RuntimeInfo.DefaultUrl;

            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "LECCOM is already running. Open this address in your browser:\n\n" +
                    url + "\n\n" + error.Message,
                    "LECCOM Schedule Builder",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }
    }

    internal sealed class TrayContext : ApplicationContext
    {
        private readonly NotifyIcon tray;
        private readonly LocalServer server;
        private readonly string url;

        public TrayContext()
        {
            DataStore.EnsureDirectories();
            RuntimeInfo.Delete();

            server = new LocalServer(AssetStore.Load(), new DataStore(), 8080, 8090);
            server.Start();
            url = RuntimeInfo.UrlForPort(server.Port);
            RuntimeInfo.WriteUrl(url);

            var menu = new ContextMenuStrip();
            menu.Items.Add("Open LECCOM", null, delegate { OpenBrowser(); });
            menu.Items.Add("Open data folder", null, delegate { OpenDataFolder(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Exit", null, delegate { ExitThread(); });

            tray = new NotifyIcon();
            tray.Text = "LECCOM Schedule Builder";
            tray.Icon = LoadTrayIcon();
            tray.ContextMenuStrip = menu;
            tray.Visible = true;
            tray.DoubleClick += delegate { OpenBrowser(); };
            tray.ShowBalloonTip(
                3000,
                "LECCOM Schedule Builder",
                "Running in the notification area. Double-click the icon to reopen.",
                ToolTipIcon.Info);

            OpenBrowser();
        }

        protected override void ExitThreadCore()
        {
            try
            {
                RuntimeInfo.Delete();
                if (server != null) server.Stop();
                if (tray != null)
                {
                    tray.Visible = false;
                    tray.Dispose();
                }
            }
            finally
            {
                base.ExitThreadCore();
            }
        }

        private void OpenBrowser()
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "Open this address in your browser:\n\n" + url + "\n\n" + error.Message,
                    "LECCOM Schedule Builder",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }

        private static void OpenDataFolder()
        {
            try
            {
                Directory.CreateDirectory(DataStore.DataDirectory);
                Process.Start(new ProcessStartInfo(DataStore.DataDirectory) { UseShellExecute = true });
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "Could not open the data folder.\n\n" + DataStore.DataDirectory +
                    "\n\n" + error.Message,
                    "LECCOM Schedule Builder",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private static Icon LoadTrayIcon()
        {
            try
            {
                var icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (icon != null) return icon;
            }
            catch
            {
            }
            return SystemIcons.Application;
        }
    }

    internal static class RuntimeInfo
    {
        public const string DefaultUrl = "http://leccom.localhost:8080";
        private const string RuntimeFileName = "runtime.txt";

        public static string UrlForPort(int port)
        {
            return "http://leccom.localhost:" + port.ToString();
        }

        private static string RuntimeFile
        {
            get { return Path.Combine(DataStore.DataDirectory, RuntimeFileName); }
        }

        public static void WriteUrl(string url)
        {
            try
            {
                DataStore.EnsureDirectories();
                File.WriteAllText(RuntimeFile, url);
            }
            catch
            {
            }
        }

        public static string ReadUrl()
        {
            try
            {
                if (!File.Exists(RuntimeFile)) return null;
                var value = File.ReadAllText(RuntimeFile).Trim();
                return value.Length == 0 ? null : value;
            }
            catch
            {
                return null;
            }
        }

        public static void Delete()
        {
            try
            {
                if (File.Exists(RuntimeFile)) File.Delete(RuntimeFile);
            }
            catch
            {
            }
        }
    }
}
