import { accountsCsvFilePath } from "./ordaoPaths.js";
import { OrdaoFrapp } from "./types/ordaoFrapp.js";
import fs from "fs";
import { parse } from "csv-parse";

export type Account = {
  address: string;
  balance: number;
};

export async function readAccountsCsv(frapp: OrdaoFrapp): Promise<{ accounts: Account[], totalRespect: number }> {
  if (frapp.parentFrappId === undefined) {
    throw new Error("Frapp has no parent frapp");
  }

  const p = accountsCsvFilePath(frapp.parentFrappId);

  if (!fs.existsSync(p)) {
    throw new Error("Parent frapp has no accounts file");
  }

  const csvData = fs.readFileSync(p);
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true
  });

  const accounts: Account[] = [];
  let totalRespect = 0;
  for await (const record of records) {
    const balance = Number(record.balance);
    accounts.push({
      address: record.address,
      balance: balance
    });
    totalRespect += balance;
  }

  return {
    accounts,
    totalRespect
  }
}