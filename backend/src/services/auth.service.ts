import pool from "../config/db";

interface GoogleIdentity {
  providerUserId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export async function findOrCreateGoogleUser(
  identity: GoogleIdentity
): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Serialize concurrent logins for the same Google identity.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [`google:${identity.providerUserId}`]
    );

    const existingAccount = await client.query<{ user_id: string }>(
      `
      SELECT user_id
      FROM oauth_accounts
      WHERE provider = 'google'
        AND provider_user_id = $1
      `,
      [identity.providerUserId]
    );

    if (existingAccount.rows.length > 0) {
      await client.query("COMMIT");
      return existingAccount.rows[0].user_id;
    }

    const email = identity.email.trim().toLowerCase();

    const existingEmail = await client.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      // Linking an existing account requires a separate verified flow.
      throw new Error("An account with this email already exists.");
    }

    const newUser = await client.query<{ id: string }>(
      `
      INSERT INTO users (email, full_name, avatar_url)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [email, identity.fullName, identity.avatarUrl]
    );

    const userId = newUser.rows[0].id;

    await client.query(
      `
      INSERT INTO oauth_accounts (
        user_id,
        provider,
        provider_user_id
      )
      VALUES ($1, 'google', $2)
      `,
      [userId, identity.providerUserId]
    );

    await client.query("COMMIT");

    return userId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}