import { Frapp, zFrapp } from "./types/frapp.js"
import fs from "fs"
import path from "path"
import { deploymentFile, fractalsDir, frappFile, localFrappFile } from "./paths.js"
import { z } from "zod";

export function readFrapp(fractalId: string): Frapp | undefined {
  const frappF = frappFile(fractalId);
  if (fs.existsSync(frappF)) {
    const frappText = fs.readFileSync(frappF, 'utf-8');
    const frapp = zFrapp.parse(JSON.parse(frappText));
    return frapp;
  } else {
    return undefined;
  }
}

export function readFrapps(): Frapp[] {
  const fractals = fs.readdirSync(fractalsDir)
  const frapps: Frapp[] = []
  for (const fractal of fractals) {
    const frapp = readFrapp(fractal);
    if (frapp) {
      frapps.push(frapp)
    }
  }
  return frapps
}

export function readTargetFrapps(targets: string[] | "all"): Frapp[] {
  const fractals = fs.readdirSync(fractalsDir)
  const frapps: Frapp[] = []
  for (const fractal of fractals) {
    if (targets === "all" || targets.includes(fractal)) {
      const frapp = readFrapp(fractal);
      if (frapp) {
        frapps.push(frapp)
      }
    }
  }
  return frapps
}

/**
 * A function that filters frapps based on a specific type. Calls readFrapps to retrieve all frapps, then uses frappType.safeParse on each frapp.
 * @typeParam T - The type to filter frapps by, represented as a Zod schema.
 * @param frappType - A Zod schema representing the type to filter by.
 * @returns An array of frapps that were successfully parsed as the specified frappType.
 */
export function readFrappType<T extends z.ZodTypeAny>(frappType: T): z.infer<T>[] {
  const frapps = readFrapps();
  return frapps.filter(frapp => frappType.safeParse(frapp).success);
}

export function readTargetFrappTypes<T extends z.ZodTypeAny>(frappType: T, targets: string[] | "all"): z.infer<T>[] {
  const frapps = readTargetFrapps(targets);
  return frapps.filter(frapp => frappType.safeParse(frapp).success);
}

export function readLocalFrappCfg<T extends z.ZodTypeAny>(frappId: string,localCfgType: T): z.infer<T> | undefined {
  const p = localFrappFile(frappId);
  if (fs.existsSync(p)) {
    const frappText = fs.readFileSync(p, 'utf-8');
    const frapp = localCfgType.parse(JSON.parse(frappText));
    return frapp;
  } else {
    return undefined;
  }
}

export function readDeployment<T extends z.ZodTypeAny>(frappId: string,deploymentType: T): z.infer<T> | undefined {
  const p = deploymentFile(frappId);
  if (fs.existsSync(p)) {
    const frappText = fs.readFileSync(p, 'utf-8');
    const frapp = deploymentType.parse(JSON.parse(frappText));
    return frapp;
  } else {
    return undefined;
  }
}
