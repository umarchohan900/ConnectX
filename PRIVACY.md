# ConnectX privacy notes (starter template)

ConnectX 2.0 is a friendship-only prototype. Do not collect or publish precise location,
school, home address, phone number, intimate images, or sensitive personal details.

This starter uses Firebase Authentication for sign-in and Firestore for a private profile
document. Profile records are marked `pending_review` and are not publicly discoverable.
There is no live messaging, public discovery, image upload, or friend-request backend.

Before inviting real users, the operator must:
- publish a complete privacy policy with contact and retention details;
- obtain qualified review of child-safety and privacy obligations in each region;
- implement reliable age assurance and age-segregated access;
- implement trained human moderation, reports, blocks, appeals and emergency escalation;
- implement account deletion and data export/deletion workflows;
- configure Firebase security rules and test them using the Firebase Emulator;
- never rely on a client-side age selector as proof of age.
