// Bussola, ricerca per significato: legge da stdin un array JSON di testi e scrive un array JSON di vettori di lunghezza 1,
// usando il modello di frasi italiano di Apple (NaturalLanguage), che gira sul Mac senza internet.
// Compilare: swiftc -O vettori.swift -o vettori
import Foundation
import NaturalLanguage
let dati = FileHandle.standardInput.readDataToEndOfFile()
guard let testi = try? JSONSerialization.jsonObject(with: dati) as? [String], let e = NLEmbedding.sentenceEmbedding(for: .italian) else { print("[]"); exit(1) }
var righe: [String] = []
for t in testi {
  let v = e.vector(for: String(t.prefix(1200))) ?? []
  let n = (v.reduce(0) { $0 + $1 * $1 }).squareRoot()
  righe.append("[" + v.map { String(format: "%.4f", n > 0 ? $0 / n : 0) }.joined(separator: ",") + "]")
}
print("[" + righe.joined(separator: ",") + "]")
