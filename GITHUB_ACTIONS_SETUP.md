# 🚀 GitHub Actions Setup Guide for iOS Build

This guide will help you set up GitHub Actions to build your iOS app automatically, which you can then install using AltStore.

## 📋 Prerequisites

1. **GitHub Account** - Free account is sufficient
2. **Expo Account** - Free account at [expo.dev](https://expo.dev)
3. **Apple ID** - Free Apple ID (the one you used: nazaryanadav10@icloud.com)

## 🔧 Step 1: Create Expo Access Token

1. **Login to Expo** (if you haven't already):
   ```bash
   npx expo login
   ```
   Enter your Expo credentials when prompted.

2. **Create Access Token**:
   - Visit [https://expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
   - Click "Create Token"
   - Name it: `GitHub Actions Build`
   - **Important**: Copy the token immediately (it won't be shown again!)

## 🔐 Step 2: Add GitHub Secrets

1. **Go to Your GitHub Repository**:
   - Navigate to your repository on GitHub
   - Click **Settings** (top menu)
   - Click **Secrets and variables** → **Actions** (left sidebar)

2. **Add the Following Secret**:
   
   Click "New repository secret" and add:
   
   - **Name**: `EXPO_TOKEN`
   - **Value**: Paste the token you created in Step 1
   - Click "Add secret"

## 📤 Step 3: Push Your Code to GitHub

If you haven't already pushed your code:

```bash
cd schedule-app
git init
git add .
git commit -m "Add GitHub Actions workflow for iOS build"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub username and repository name.

## ▶️ Step 4: Trigger the Build

### Option A: Automatic Build (on push)
The workflow will automatically run when you push to the `main` or `master` branch.

### Option B: Manual Build
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Select "Build iOS App for AltStore" from the left sidebar
4. Click "Run workflow" button (right side)
5. Select the branch (usually `main`)
6. Click "Run workflow"

## 📥 Step 5: Download Your .ipa File

1. **Wait for Build to Complete**:
   - Go to **Actions** tab in your repository
   - Click on the running workflow
   - Wait for it to complete (usually 10-20 minutes)

2. **Get Build Link**:
   - After the build starts, check the EAS Build dashboard
   - Visit: [https://expo.dev](https://expo.dev)
   - Click your project → **Builds**
   - Download the `.ipa` file when ready

## 📱 Step 6: Install with AltStore

1. **Download the .ipa file** to your computer

2. **Transfer to iOS Device**:
   - Use AirDrop, or
   - Email it to yourself, or
   - Upload to cloud storage (iCloud, Dropbox, etc.)

3. **Install via AltStore**:
   - Open **AltStore** on your iOS device
   - Tap the **"+"** button
   - Choose **"Install from Files"** or **"Install from Computer"**
   - Select your downloaded `.ipa` file
   - Wait for installation to complete

4. **Trust the App**:
   - Go to **Settings** → **General** → **VPN & Device Management**
   - Find your Apple ID profile
   - Tap **Trust**

## 🔄 App Refresh (Important!)

Since you're using a free Apple ID:
- **Apps expire after 7 days**
- Use **AltStore** to refresh before expiration
- Keep AltStore and your computer on the same WiFi for auto-refresh

## 🛠 Troubleshooting

### Build Fails on GitHub Actions

1. **Check Secrets**: Ensure `EXPO_TOKEN` is set correctly
2. **Check Logs**: View detailed logs in the Actions tab
3. **Re-run**: Sometimes builds fail due to temporary issues - try again

### "No Team Associated" Error

This means EAS is trying to use paid developer features. The workflow is configured for free accounts, but if you still get this error:

1. Make sure you answered **"No"** when asked about logging into Apple Developer account
2. Try using Expo Go instead (see below)

### Alternative: Use Expo Go (No Build Required)

If builds keep failing, you can use Expo Go for immediate testing:

```bash
cd schedule-app
npx expo start
```

Then scan the QR code with Expo Go app from the App Store.

## 📊 Monitoring Builds

- **GitHub Actions**: Check build status and logs
- **EAS Dashboard**: [https://expo.dev](https://expo.dev) → Your project → Builds
- **Build History**: View all your builds and download previous versions

## 💡 Tips

1. **First Build Takes Longest**: Initial builds can take 20-30 minutes
2. **Subsequent Builds**: Usually faster (10-15 minutes)
3. **Save .ipa Files**: Keep copies of working builds
4. **Test Before Distributing**: Always test on your device first

## 🆘 Need Help?

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AltStore Guide](https://altstore.io/)

---

**Happy Building! 🎉**

