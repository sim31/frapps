import * as objectSha from 'object-sha'

export async function hashObject(obj: object) {
  const hashable = objectSha.hashable(obj);
  const inputsHash = await objectSha.digest(hashable, 'SHA-256');
  return inputsHash.substring(0, 2) + " " + inputsHash.substring(2, 4) +
    " " + inputsHash.substring(4, 6) + " " + inputsHash.substring(6, 8);
}