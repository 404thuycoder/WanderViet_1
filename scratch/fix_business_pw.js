db.businessaccounts.updateOne(
  { email: 'admin@company.com' },
  { $set: { password: '$2b$10$vuEqloXtlOXC2FCD.lFcpe0HJamEV1hNZqG4uWlT.FFToubcZwK6q' } }
);
