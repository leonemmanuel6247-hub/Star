# Keystore Android (chiffré)

`star-release.p12` contient la clé privée de signature de StarOffice,
**chiffrée en AES-256** (format PKCS#12). Sans le mot de passe, ce fichier
est inutilisable — il peut donc vivre dans Git sans risque.

Le mot de passe est stocké dans le Secret GitHub `STAR_KEYSTORE_PASSWORD`
(Settings → Secrets and variables → Actions). La CI l'utilise pour signer
l'APK release : **tous les builds partagent la même signature**, donc les
mises à jour s'installent par-dessus l'ancienne version sans désinstaller.

Sans ce Secret, la CI génère un keystore éphémère (l'APK reste installable
mais chaque build a une signature différente).
