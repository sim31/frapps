import { WithId } from "mongodb"
import { withoutProperty } from "@sim31/ts-utils"

export function withoutId<T>(doc: WithId<T>): Omit<WithId<T>, '_id'> {
  return withoutProperty(doc, '_id');  
}