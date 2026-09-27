# WorkNest Improved Firebase Starter

## Firebase
1. Firebase Console -> Authentication -> Sign-in method -> enable Email/Password.
2. Create Firestore Database.
3. Put your Firebase Web App config into `assets/app.js`.
4. Publish `firebase/firestore.rules`.
5. Optional: publish `firebase/storage.rules`.

## UPI
The current UI uses the merchant UPI ID:
`vishalkhan@fam`

The application fee is embedded into the UPI payment URI, so Data Entry/Typing/Writing jobs can generate different QR amounts.

### Important payment implementation note
The front-end submits a transaction/reference ID for verification. A reference ID alone is NOT proof that money was received. Before production, connect a compliant payment provider or server-side payment verification/webhook. Do not mark an application as paid solely because a browser says it was paid.

## Admin
Create a normal Firebase user, then set `users/{uid}.role` to `admin` in Firestore. Do not expose Firebase service-account credentials in the browser.

## UI
Responsive mobile-first layout, dashboard cards, job cards, account dropdown, task table, wallet, FAQ, support and payment modal are included.


## Integrated Admin Panel

Open `admin.html` after deploying the site. Admin UI access is checked against `users/{uid}.role == "admin"` and Firestore rules also restrict admin writes.

Admin features:
- Dashboard metrics
- User list
- Add/Edit/Delete jobs
- Application/payment verification
- Submission approval/rejection
- Payout status management
- Support ticket management

### Create an admin
1. Register an account normally.
2. Firebase Console -> Firestore -> `users` -> that user's document.
3. Set `role` to `admin`.
4. Sign in again and open Admin Panel.

The browser check is only for UI routing. Firestore rules are the actual authorization boundary.
