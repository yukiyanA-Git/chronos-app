using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

public class Program {
    public static void Main(string[] args) {
        string appDir = @"C:\Users\Iwamoto\.gemini\antigravity\scratch\calendar-scheduler";
        string pngPath = Path.Combine(appDir, "chronos-icon.png");
        string icoPath = Path.Combine(appDir, "chronos-icon.ico");
        string deskIco = @"C:\Users\Iwamoto\Desktop\chronos-icon.ico";

        if (!File.Exists(pngPath)) {
            Console.WriteLine("PNG not found: " + pngPath);
            return;
        }

        using (Image srcImg = Image.FromFile(pngPath)) {
            using (Bitmap bmp = new Bitmap(256, 256, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                    g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                    g.DrawImage(srcImg, 0, 0, 256, 256);
                }

                IntPtr hIcon = bmp.GetHicon();
                using (Icon icon = Icon.FromHandle(hIcon)) {
                    using (FileStream fs1 = new FileStream(icoPath, FileMode.Create, FileAccess.Write)) {
                        icon.Save(fs1);
                    }
                    using (FileStream fs2 = new FileStream(deskIco, FileMode.Create, FileAccess.Write)) {
                        icon.Save(fs2);
                    }
                }
            }
        }

        Console.WriteLine("Standard ICO successfully created!");
    }
}
