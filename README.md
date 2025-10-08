# Finance Dashboard

This project is a Firebase-hosted personal finance dashboard. The app uses Firebase Authentication and Firestore to manage user sessions, budgets, and spending data.

## Continuous Deployment

The repository includes a GitHub Actions workflow that automatically deploys the site to Firebase Hosting whenever changes are pushed to the `main` branch. You can also run the workflow manually from the **Actions** tab if you need to redeploy without making new commits.

### 1. Create or locate the Firebase project

1. Visit the [Firebase console](https://console.firebase.google.com/) and either select the existing project that hosts this dashboard or create a new one.
2. If you create a project from scratch, the console automatically provisions a corresponding Google Cloud project. You will see it later inside the Google Cloud Console; no extra manual setup is required.
3. Enable Firebase Hosting for the project if you have not already by following the console prompts under **Hosting → Get started**.

> **Need to double-check the Google Cloud side?** Open the [Google Cloud Console](https://console.cloud.google.com/projectselector2/home/dashboard) and confirm that the same project ID from Firebase appears there. Firebase projects and Google Cloud projects share the same underlying resources, so you only need to create it once in Firebase.

### 2. Prepare a Firebase service account

1. Open the [Google Cloud Console service accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts) for your Firebase project.
2. Create a new service account (or select an existing one) with the **Firebase Hosting Admin** and **Firebase Rules Admin** roles. These permissions allow the workflow to deploy hosting assets and publish updated Firestore rules/indexes if needed.
3. Generate a JSON key for the service account and download it. Keep this file secure; it grants deployment access to your project.

### 3. Store credentials in GitHub

1. In your GitHub repository, navigate to **Settings → Secrets and variables → Actions**.
2. Create a new **Repository secret** named `FIREBASE_SERVICE_ACCOUNT`.
3. Paste the entire contents of the JSON key file you downloaded in step 1 into the secret value field and save.

> **Tip:** If you prefer to use a short-lived token instead, you can run `firebase login:ci` locally and store the generated token in a secret named `FIREBASE_TOKEN`. The workflow is already configured for the service-account approach because it is more secure and can be rotated easily.

### 4. Enable GitHub Actions

Ensure GitHub Actions is enabled for the repository. Once enabled, every push to `main` triggers the deployment workflow defined in [`.github/workflows/firebase-hosting.yml`](.github/workflows/firebase-hosting.yml).

The workflow performs the following steps:

1. Checks out the repository.
2. Sets up Node.js 20 for consistent CLI behaviour.
3. Writes the `FIREBASE_SERVICE_ACCOUNT` secret to a temporary credentials file and points the Firebase CLI at it.
4. Installs the Firebase CLI globally with `npm install -g firebase-tools`.
5. Runs `npm run build` if a `package.json` is present (static sites without a build step simply skip it).
6. Calls `firebase deploy --only hosting --project finance-dashboard-10nfl` to publish the latest assets.
7. Publishes a run summary that links to the deployed site and release in the Firebase console.

### 5. Monitor deployments

After each run, review the workflow logs in the **Actions** tab to confirm that the deploy succeeded. The workflow now publishes a run summary that includes the deployed channel, a direct link to the release in Firebase Hosting, and a link back to the workflow run for auditing.

If you prefer to double-check outside of GitHub:

* Open the [Firebase console](https://console.firebase.google.com/project/finance-dashboard-10nfl/hosting/sites) and confirm that the latest release timestamp matches your push.
* Or, from your terminal, run `firebase hosting:releases:list --site finance-dashboard-10nfl --limit 1` to inspect the most recent production deploy.

## Local development

1. Install the Firebase CLI if you have not already: `npm install -g firebase-tools`.
2. Log in with your Firebase account: `firebase login`.
3. Start the local emulators: `firebase emulators:start`.
4. Open http://localhost:5000 to view the app with live-reloading.

When you are satisfied with your changes, commit and push them to `main` to trigger an automated deployment.
