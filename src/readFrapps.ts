import { Frapp, zFrapp } from "./types/frapp"
import fs from "fs"
import path from "path"
import { fractalsDir } from "./paths"

export function readFrapps(): Frapp[] {
  const fractals = fs.readdirSync(fractalsDir)
  const frapps: Frapp[] = []
  for (const fractal of fractals) {
    const fractalDir = path.join(fractalsDir, fractal)
    const frappFile = path.join(fractalDir, "frapp.json")
    if (fs.existsSync(frappFile)) {
      const frappText = fs.readFileSync(frappFile, 'utf-8');
      const frapp = zFrapp.parse(JSON.parse(frappText));
      frapps.push(frapp)
    }
  }
  return frapps
}
