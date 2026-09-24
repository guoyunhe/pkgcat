# Contributing

## Local development accounts

The database seed creates these accounts for local development and testing only:

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| admin | `admin@example.com` | `Admin123!` |
| user  | `user@example.com`  | `User123!`  |

Do not use these credentials outside a local development environment. Run `node ace migration:fresh --seed` to recreate the database and seed the accounts.

## System requirements

```bash
sudo zypper install git nodejs mariadb podman-compose dpkg
```

## Bootstrap

To bootstrap the development environment, run the following command:

```bash
pnpm install
cp .env.example .env
node ace migration:fresh --seed
node ace repo:sync
```

## Running the development environment

```bash
pnpm dev
```
