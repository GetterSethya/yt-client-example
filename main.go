package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"
)

//go:embed dist
var distFS embed.FS

// spaHandler serves the embedded files and falls back to index.html for
// paths without a matching file, so client-side routes deep-link correctly.
type spaHandler struct {
	fileServer http.Handler
	root       fs.FS
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if _, err := fs.Stat(h.root, strings.TrimPrefix(r.URL.Path, "/")); err != nil {
		r.URL.Path = "/"
	}
	h.fileServer.ServeHTTP(w, r)
}

func main() {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", &spaHandler{
		fileServer: http.FileServer(http.FS(sub)),
		root:       sub,
	})

	addr := ":6767"
	log.Printf("serving on http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
