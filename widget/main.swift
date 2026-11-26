// Bussola Widget: una finestrella senza bordi appoggiata sulla scrivania
// che mostra http://localhost:4321/widget.
// - Si sposta trascinando la fascia in alto (la data).
// - Si ridimensiona dai bordi.
// - Posizione e misura vengono ricordate.
// - Un clic sulla fascia o sulla carta apre la piattaforma nel browser.
import Cocoa
import WebKit

let pagina = URL(string: "http://localhost:4321/widget")!
let piattaforma = URL(string: "http://localhost:4321/#oggi")!

// Una finestra senza bordi di norma non accetta la tastiera: serve per scrivere un da fare.
final class Finestra: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

// Fascia trasparente sopra la data: trascinando sposta la finestra, con un clic apre la piattaforma.
final class Maniglia: NSView {
    private var trascinato = false
    override func mouseDown(with event: NSEvent) { trascinato = false }
    override func mouseDragged(with event: NSEvent) {
        if !trascinato { trascinato = true; window?.performDrag(with: event) }
    }
    override func mouseUp(with event: NSEvent) { if !trascinato { NSWorkspace.shared.open(piattaforma) } }
    override func resetCursorRects() { addCursorRect(bounds, cursor: .openHand) }
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
}

final class App: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: Finestra!
    var web: WKWebView!
    var caricata = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        let size = NSSize(width: 330, height: 360)
        let schermo = (NSScreen.main ?? NSScreen.screens[0]).visibleFrame
        let iniziale = NSRect(x: schermo.maxX - size.width - 20, y: schermo.maxY - size.height - 20, width: size.width, height: size.height)
        window = Finestra(contentRect: iniziale, styleMask: [.borderless, .resizable], backing: .buffered, defer: false)
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.appearance = NSAppearance(named: .aqua)   // sempre chiaro
        window.minSize = NSSize(width: 240, height: 190)
        window.maxSize = NSSize(width: 640, height: 900)
        // Sopra le icone della scrivania, sotto tutte le finestre normali.
        window.level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)) + 1)
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
        window.setFrameAutosaveName("BussolaWidget")       // ricorda posizione e misura

        let contenuto = window.contentView!
        web = WKWebView(frame: contenuto.bounds, configuration: WKWebViewConfiguration())
        web.autoresizingMask = [.width, .height]
        web.setValue(false, forKey: "drawsBackground")
        web.navigationDelegate = self
        web.uiDelegate = self
        contenuto.addSubview(web)

        let altezzaManiglia: CGFloat = 62
        let maniglia = Maniglia(frame: NSRect(x: 14, y: contenuto.bounds.height - altezzaManiglia - 6, width: contenuto.bounds.width - 28, height: altezzaManiglia))
        maniglia.autoresizingMask = [.width, .minYMargin]
        contenuto.addSubview(maniglia)

        window.orderFront(nil)
        ricarica()
        // Se il server non era ancora pronto, riprova finché non risponde.
        Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            guard let self, !self.caricata else { return }
            self.ricarica()
        }
    }

    func ricarica() { web.load(URLRequest(url: pagina, cachePolicy: .reloadIgnoringLocalCacheData)) }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { caricata = true; window.alphaValue = 1 }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { caricata = false; window.alphaValue = 0 }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { caricata = false; window.alphaValue = 0 }

    // Il clic sulla carta è un link che chiede una nuova finestra: lo apriamo nel browser.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.host == "localhost" { NSWorkspace.shared.open(url) }
        return nil
    }
    // Il widget resta sulla sua pagina: qualsiasi altra navigazione va nel browser.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, navigationAction.navigationType == .linkActivated {
            if url.host == "localhost" { NSWorkspace.shared.open(url) }
            decisionHandler(.cancel); return
        }
        decisionHandler(.allow)
    }
}

let app = NSApplication.shared
let delegate = App()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
