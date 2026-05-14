# Security Specification - Chasqui Logistics

## 1. Data Invariants
- A **Trip** must always reference a valid **Cargo** and both a **Merchant** and a **Carrier**.
- A **Merchant** cannot create a **Trip** directly; it must result from an accepted **Offer**.
- **Admin** accounts are hardcoded by email and checked in the `users` collection for the `admin` role.
- **Payment Config** is only modifiable by designated Admins.
- **Location Updates** are only modifiable by the **Carrier** assigned to the Trip.
- **Payment Verification** is only performed by **Admins**.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

1. **Identity Spoofing**: User A tries to update User B's profile.
2. **Role Escalation**: Commercial user tries to set `tipoUsuario: 'admin'`.
3. **Price Manipulation**: Carrier tries to update the `precioFinal` of a Trip after it's started.
4. **Offer Injection**: User tries to create an offer for a cargo they published themselves.
5. **Payment Bypass**: Merchant tries to set `estado: 'en_camino_a_recojo'` without admin verification.
6. **Config Hijacking**: Authenticated non-admin user tries to change the YAPE number in `/config/payment_methods`.
7. **Negative Payout**: Admin (malicious or compromised) tries to set a negative `montoPagado`.
8. **Rating Spawning**: User tries to rate themselves.
9. **Orphaned Offer**: User tries to create an offer for a non-existent `cargoId`.
10. **Shadow Field Injection**: User adds `isVerified: true` to their profile during a standard update.
11. **Query Scraping**: User tries to list all `trips` in the system without filtering by their own ID.
12. **ID Poisoning**: User tries to create a document with a 1MB string as the ID.

## 3. Test Runner Strategy
We will implement `firestore.rules` that address these vectors using strict validation and relational checks.
