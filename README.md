# Finance Dashboard

This project is a Firebase-hosted personal finance dashboard. The app uses Firebase Authentication and Firestore to manage user sessions, budgets, and spending data.

## Continuous Deployment

The repository includes a GitHub Actions workflow that automatically deploys the site to Firebase Hosting whenever changes are pushed to the `main` branch. You can also run the workflow manually from the **Actions** tab if you need to redeploy without making new commits.

### 1. Prepare a Firebase service account

1. Open the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts) for the Firebase project `finance-dashboard-10nfl`.
2. Create a new service account (or select an existing one) with the **Firebase Hosting Admin** and **Firebase Rules Admin** roles. These permissions allow the workflow to deploy hosting assets and publish updated Firestore rules/indexes if needed.
3. Generate a JSON key for the service account and download it. Keep this file secure; it grants deployment access to your project.

### 2. Store credentials in GitHub

1. In your GitHub repository, navigate to **Settings → Secrets and variables → Actions**.
2. Create a new **Repository secret** named `FIREBASE_SERVICE_ACCOUNT`.
3. Paste the entire contents of the JSON key file you downloaded in step 1 into the secret value field and save.

> **Tip:** If you prefer to use a short-lived token instead, you can run `firebase login:ci` locally and store the generated token in a secret named `FIREBASE_TOKEN`. The workflow is already configured for the service-account approach because it is more secure and can be rotated easily.

### 3. Enable GitHub Actions

Ensure GitHub Actions is enabled for the repository. Once enabled, every push to `main` triggers the deployment workflow defined in [`.github/workflows/firebase-hosting.yml`](.github/workflows/firebase-hosting.yml).

The workflow performs the following steps:

1. Checks out the repository.
2. Installs the Firebase CLI.
3. Deploys the latest build to Firebase Hosting using the credentials stored in `FIREBASE_SERVICE_ACCOUNT`.

### 4. Monitor deployments

After each run, review the workflow logs in the **Actions** tab to confirm that the deploy succeeded. Firebase will show the new release in the Hosting panel, and the action output includes a direct link to the deployed site.

## Local development

1. Install the Firebase CLI if you have not already: `npm install -g firebase-tools`.
2. Log in with your Firebase account: `firebase login`.
3. Start the local emulators: `firebase emulators:start`.
4. Open http://localhost:5000 to view the app with live-reloading.

When you are satisfied with your changes, commit and push them to `main` to trigger an automated deployment.
