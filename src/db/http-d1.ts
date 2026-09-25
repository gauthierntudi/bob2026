type QueryResult = {
  results?: Record<string, unknown>[];
  success?: boolean;
  meta?: Record<string, unknown>;
};

class HttpStatement {
  constructor(
    private readonly database: HttpD1,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new HttpStatement(this.database, this.sql, params);
  }

  all() {
    return this.database.query(this.sql, this.params);
  }

  async run() {
    const result = await this.all();
    return { success: true, meta: result.meta ?? {} };
  }

  async raw() {
    const result = await this.all();
    return (result.results ?? []).map((row) => Object.values(row));
  }
}

class HttpD1 {
  constructor(
    private readonly accountId: string,
    private readonly databaseId: string,
    private readonly token: string,
  ) {}

  prepare(sql: string) {
    return new HttpStatement(this, sql);
  }

  batch(statements: HttpStatement[]) {
    return Promise.all(statements.map((statement) => statement.all()));
  }

  async query(sql: string, params: unknown[]): Promise<QueryResult> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      },
    );
    const body = (await response.json()) as {
      success?: boolean;
      errors?: { message?: string }[];
      result?: QueryResult[];
    };
    if (!response.ok || !body.success || !body.result?.[0]) {
      throw new Error(body.errors?.[0]?.message || "La requête D1 a échoué.");
    }
    return body.result[0];
  }
}

export function httpD1FromEnv() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId =
    process.env.CLOUDFLARE_D1_DATABASE_ID || "ce16e223-ce33-4223-9e21-2d6809b010e1";
  if (!accountId || !token) return null;
  return new HttpD1(accountId, databaseId, token);
}
