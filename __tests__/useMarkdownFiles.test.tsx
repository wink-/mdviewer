import { beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { useMarkdownFiles } from "../hooks/useMarkdownFiles"

function HookHarness() {
  const api = useMarkdownFiles()

  return (
    <div>
      <button onClick={() => api.createFile("first")}>create-first</button>
      <button onClick={() => api.createFile("second")}>create-second</button>
      <button
        onClick={() => {
          if (api.activeFile) {
            api.updateFileFormat(api.activeFile.id, "mediawiki")
          }
        }}
      >
        switch-to-wiki
      </button>
      <div data-testid="formats">{api.files.map((file) => `${file.name}:${file.format}`).join("|")}</div>
    </div>
  )
}

describe("useMarkdownFiles default format behavior", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("creates blank files with the default markdown format and remembers the last selected format", () => {
    render(<HookHarness />)

    fireEvent.click(screen.getByText("create-first"))
    expect(screen.getByTestId("formats")).toHaveTextContent("first:markdown")

    fireEvent.click(screen.getByText("switch-to-wiki"))
    fireEvent.click(screen.getByText("create-second"))

    expect(screen.getByTestId("formats")).toHaveTextContent("first:mediawiki")
    expect(screen.getByTestId("formats")).toHaveTextContent("second:mediawiki")
  })
})
