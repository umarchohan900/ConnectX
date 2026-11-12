# ConnectX 2.0 — phone-friendly PWA starter

Black/red friendship-community interface with Firebase Email/Password and Google sign-in.

## Important status
This is an **authentication + private-profile starter**, not a production public social network.
Google/Email login works only after you configure your own Firebase project. Profile documents
are private and pending review. Public discovery, friend requests, chat, image uploads and
admin moderation are intentionally disabled until age assurance and safety systems are built.

## Set up Firebase (phone or PC)
1. Open https://console.firebase.google.com/ and create a project.
2. Add a Web app and copy its Firebase config into `firebase-config.js`.
3. In Authentication -> Sign-in method, enable Email/Password and Google.
4. In Firestore Database, create a database.
5. Open Firestore Rules and paste `firestore.rules`, then Publish.
6. Add your GitHub Pages domain to Authentication -> Settings -> Authorized domains.
7. Commit all files to your GitHub repository (replace the old files).
8. Open the GitHub Pages website over HTTPS and test signup/login.

## GitHub Pages update from Android
- Open your ConnectX repository -> Add file -> Upload files.
- Upload the files from this folder to the repository root, replacing existing files.
- Commit changes. Keep `index.html` at the root.

## Phone install
Open the HTTPS GitHub Pages URL in Chrome -> menu (⋮) -> Add to Home screen / Install app.

## Safety / age note
This is a friendship-only project. Do not enable unrestricted stranger messaging or dating features.
The profile form only accepts teen age bands for this prototype, but a self-selected age is NOT
reliable age verification. Do not publicly expose profiles until robust age assurance, moderation,
privacy review, reporting/blocking, account deletion and child-safety controls are implemented.
Do not use this starter to collect data from children without appropriate legal/guardian review.

## Google Play
A PWA is not automatically an Android APK/AAB. Play Store publication requires a separate Android
packaging/signing workflow and current Play Console policy review. GitHub Pages hosting is not
Google Play publication.
