import React from "react";
import {
  MdPalette,
  MdTextFields,
  MdSpaceDashboard,
  MdBorderColor,
  MdLayers,
  MdInfoOutline,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdFontDownload,
  MdFormatLineSpacing,
  MdDataObject,
  MdGridOn,
  MdViewQuilt,
} from "react-icons/md";

const ThemeTestPage = () => {
  const UtilityDescription: React.FC<{
    title: string;
    items: { class: string; property: string; notes?: string }[];
  }> = ({ title, items }) => (
    <div className="mb-8 p-4 border rounded-lg bkg-elm-alt">
      <h3 className="text-xl font-semibold mb-3 txt-prm flex items-center">
        <MdDataObject className="mr-2" /> {title}
      </h3>
      <ul className="list-disc pl-5 space-y-1 txt-dark">
        {items.map((item) => (
          <li key={item.class}>
            <code className="bkg-gry-100 p-1 rounded txt-acc">.{item.class}</code> - uses{" "}
            <code className="bkg-gry-100 p-1 rounded txt-sec">var({item.property})</code>
            {item.notes && <span className="txt-muted"> ({item.notes})</span>}
          </li>
        ))}
      </ul>
    </div>
  );

  const ColorSwatch: React.FC<{
    colorVar: string;
    name: string;
    children?: React.ReactNode;
    textColorVar?: string;
    className?: string;
  }> = ({ colorVar, name, children, textColorVar, className }) => (
    <div
      className={`p-4 rounded-md shadow-sm text-center ${className}`}
      style={{
        backgroundColor: `var(${colorVar})`,
        color: textColorVar
          ? `var(${textColorVar})`
          : colorVar.includes("-lht") ||
            colorVar.includes("-50") ||
            colorVar.includes("-100") ||
            colorVar.includes("-wht")
          ? "var(--clr-txt-dark)"
          : "var(--clr-txt-light)",
      }}
    >
      {children ? (
        <>
          <div className="font-semibold flex items-center justify-center">{children}</div>
          <div className="text-xs mt-1">{name}</div>
          <div className="text-xs mt-0.5 opacity-75">({colorVar})</div>
        </>
      ) : (
        <>
          <div className="font-semibold">{name}</div>
          <div className="text-xs mt-1">{colorVar}</div>
        </>
      )}
    </div>
  );

  return (
    <div className="container py-8 spacing" style={{ "--flow-space": "2rem" } as React.CSSProperties}>
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold txt-prm mb-2" style={{ fontFamily: "var(--ff-heading)" }}>
          Theme & Styling Test Page
        </h1>
        <p className="text-lg txt-muted" style={{ fontFamily: "var(--ff-base)" }}>
          A visual test suite for CSS custom properties and utility classes.
        </p>
      </header>

      {/* Analysis Section */}
      <section className="mb-12 p-6 bkg-elm rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 txt-prm flex items-center">
          <MdInfoOutline className="mr-2" /> CSS Theme Analysis & Recommendations
        </h2>
        <div className="txt-dark space-y-3">
          <p>
            <strong className="txt-sec">Strengths:</strong> Well-structured CSS Layers, comprehensive HSL-based custom
            properties for colors in <code className="bkg-gry-100 p-1 rounded">vars.css</code>, semantic color naming,
            and good base utility classes for backgrounds and text colors in{" "}
            <code className="bkg-gry-100 p-1 rounded">utils.css</code>.
          </p>
          <p>
            <strong className="txt-sec">Areas for Improvement:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1 txt-muted">
            <li>
              <strong>Typography Utilities:</strong> Add classes for font families (
              <code className="bkg-gry-100 p-1 rounded">.ff-heading</code>,{" "}
              <code className="bkg-gry-100 p-1 rounded">.ff-accent</code>), font sizes (e.g.,{" "}
              <code className="bkg-gry-100 p-1 rounded">.fs-sm</code>,{" "}
              <code className="bkg-gry-100 p-1 rounded">.fs-lg</code>), font weights, and text alignment.
            </li>
            <li>
              <strong>Spacing Utilities:</strong> Implement granular margin/padding utilities (e.g.,{" "}
              <code className="bkg-gry-100 p-1 rounded">.m-1</code>,{" "}
              <code className="bkg-gry-100 p-1 rounded">.pt-2</code>) based on a defined spacing scale.
            </li>
            <li>
              <strong>Border & Shadow Utilities:</strong> Create utilities for borders (color, width, style, radius) and
              box shadows.
            </li>
            <li>
              <strong>Info Color:</strong> Update <code className="bkg-gry-100 p-1 rounded">--clr-inf</code> to a more
              distinct color. Currently <code className="bkg-gry-100 p-1 rounded">hsl(160 70% 40%)</code>.
            </li>
            <li>
              <strong>Invalid CSS:</strong> Correct <code className="bkg-gry-100 p-1 rounded">.bkg-none</code> to{" "}
              <code className="bkg-gry-100 p-1 rounded">background-color: transparent;</code> and{" "}
              <code className="bkg-gry-100 p-1 rounded">.txt-none</code> to{" "}
              <code className="bkg-gry-100 p-1 rounded">color: transparent;</code> or similar.
            </li>
          </ul>
        </div>
      </section>

      {/* Color Palette Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdPalette className="mr-3" /> Color Palette
        </h2>

        {/* Primary, Secondary, Accent Colors */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 txt-sec">Brand Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorSwatch colorVar="--clr-prm-lht" name="Primary Light" textColorVar="--clr-txt-dark" />
            <ColorSwatch colorVar="--clr-prm" name="Primary" />
            <ColorSwatch colorVar="--clr-prm-drk" name="Primary Dark" />
            <ColorSwatch colorVar="--clr-sec-lht" name="Secondary Light" textColorVar="--clr-txt-dark" />
            <ColorSwatch colorVar="--clr-sec" name="Secondary" />
            <ColorSwatch colorVar="--clr-sec-drk" name="Secondary Dark" />
            <ColorSwatch colorVar="--clr-acc-lht" name="Accent Light" textColorVar="--clr-txt-dark" />
            <ColorSwatch colorVar="--clr-acc" name="Accent" />
            <ColorSwatch colorVar="--clr-acc-drk" name="Accent Dark" />
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 txt-sec">Semantic Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ColorSwatch colorVar="--clr-sxs" name="Success" className="flex items-center justify-center">
              <MdCheckCircle className="mr-2" />
              Success
            </ColorSwatch>
            <ColorSwatch colorVar="--clr-wrn" name="Warning" className="flex items-center justify-center">
              <MdWarning className="mr-2" />
              Warning
            </ColorSwatch>
            <ColorSwatch colorVar="--clr-dng" name="Danger" className="flex items-center justify-center">
              <MdError className="mr-2" />
              Danger
            </ColorSwatch>
            <ColorSwatch colorVar="--clr-inf" name="Info" className="flex items-center justify-center">
              <MdInfoOutline className="mr-2" />
              Info (Needs Update)
            </ColorSwatch>
          </div>
        </div>

        {/* Grayscale Colors */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 txt-sec">Grayscale Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch colorVar="--clr-wht" name="White" />
            {Array.from({ length: 10 }, (_, i) => {
              const shade = i * 100 === 0 ? 50 : i * 100;
              return <ColorSwatch key={shade} colorVar={`--clr-gry-${shade}`} name={`Gray ${shade}`} />;
            })}
            <ColorSwatch colorVar="--clr-blk" name="Black" />
          </div>
        </div>

        {/* UI Element Colors */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 txt-sec">UI Element Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorSwatch colorVar="--clr-bck-body" name="Body Background" />
            <ColorSwatch colorVar="--clr-bck-elm" name="Element Background" />
            <ColorSwatch colorVar="--clr-bck-elm-alt" name="Alt Element Background" />
            <ColorSwatch colorVar="--clr-dvd" name="Divider" textColorVar="--clr-txt-dark" />
            <div
              className="p-4 rounded-md shadow-sm text-center txt-dark"
              style={{ border: "2px solid var(--clr-focus-ring)" }}
            >
              Focus Ring (applied as border)
              <div className="text-xs mt-1">--clr-focus-ring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdTextFields className="mr-3" /> Typography
        </h2>
        <div className="bkg-elm p-6 rounded-lg shadow">
          <div className="mb-4">
            <p style={{ fontFamily: "var(--ff-base)" }} className="txt-dark">
              Base Font (--ff-base): &quot;Inter&quot;, sans-serif. Used for body text.{" "}
              <em className="txt-muted">The quick brown fox jumps over the lazy dog.</em>
            </p>
            <p style={{ fontFamily: "var(--ff-heading)" }} className="txt-dark">
              Heading Font (--ff-heading): &quot;Montserrat&quot;, sans-serif. Used for headings.{" "}
              <strong className="txt-prm">Stylish Headings</strong>
            </p>
            <p style={{ fontFamily: "var(--ff-accent)" }} className="txt-dark">
              Accent Font (--ff-accent): &quot;Playfair Display&quot;, serif. For special text.{" "}
              <i className="txt-acc">Elegant Accents</i>
            </p>
            <p style={{ fontFamily: "var(--ff-code)" }} className="txt-dark">
              Code Font (--ff-code): &quot;Fira Code&quot;, monospace.{" "}
              <code className="bkg-gry-100 p-1 rounded txt-sec">const example = &apos;code&apos;;</code>
            </p>
          </div>
          <div className="mb-4">
            <p className="txt-dark" style={{ lineHeight: "var(--lh-base)" }}>
              Base Line Height (--lh-base): 1.5 (fallback). Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <h4 className="txt-dark" style={{ lineHeight: "var(--lh-heading)", fontFamily: "var(--ff-heading)" }}>
              Heading Line Height (--lh-heading): 1.1 (fallback). Example Heading
            </h4>
          </div>
          <UtilityDescription
            title="Missing Typography Utilities (Recommended)"
            items={[
              { class: "ff-base", property: "--ff-base", notes: "Apply base font family" },
              { class: "ff-heading", property: "--ff-heading", notes: "Apply heading font family" },
              { class: "ff-accent", property: "--ff-accent", notes: "Apply accent font family" },
              {
                class: "fs-xs, fs-sm, fs-md, fs-lg, fs-xl, ...",
                property: "--fs-md: 1rem; (example scale)",
                notes: "Font size utilities",
              },
              {
                class: "fw-light, fw-normal, fw-medium, fw-semibold, fw-bold",
                property: "--fw-normal: 400; (example scale)",
                notes: "Font weight utilities",
              },
              {
                class: "text-left, text-center, text-right, text-justify",
                property: "text-align: left;",
                notes: "Text alignment utilities",
              },
            ]}
          />
        </div>
      </section>

      {/* Background Utilities Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdLayers className="mr-3" /> Background Utilities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            "prm",
            "prm-lht",
            "prm-drk",
            "sec",
            "sec-lht",
            "sec-drk",
            "acc",
            "acc-lht",
            "acc-drk",
            "sxs",
            "wrn",
            "dng",
            "inf",
            "wht",
            "gry-100",
            "gry-500",
            "gry-900",
            "blk",
            "bck-body",
            "bck-elm",
            "bck-elm-alt",
          ].map((type) => (
            <ColorSwatch
              key={type}
              colorVar={`--clr-${type.startsWith("bck-") ? type.replace("bck-", "") : type}`}
              name={`.bkg-${type}`}
              className={`bkg-${type}`}
            />
          ))}
          <div className="p-4 rounded-md shadow-sm text-center txt-dark bkg-gry-100">
            <div className="font-semibold">.bkg-none</div>
            <div className="text-xs mt-1">background-color: none (Invalid - should be transparent)</div>
          </div>
        </div>
        <UtilityDescription
          title="Background Color Utilities"
          items={[
            { class: "bkg-prm", property: "--clr-prm" },
            { class: "bkg-gry-100", property: "--clr-gry-100" },
            { class: "bkg-body", property: "--clr-bck-body" },
            { class: "bkg-none", property: "none (invalid)", notes: "Should be transparent" },
          ]}
        />
      </section>

      {/* Text Color Utilities Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdFontDownload className="mr-3" /> Text Color Utilities
        </h2>
        <div className="bkg-elm p-6 rounded-lg shadow space-y-2">
          <p className="txt-light bkg-gry-800 p-2 rounded">.txt-light (on dark background)</p>
          <p className="txt-dark bkg-gry-100 p-2 rounded">.txt-dark (on light background)</p>
          <p className="txt-muted">.txt-muted: Muted text for less emphasis.</p>
          <p className="txt-disabled">.txt-disabled: For disabled elements.</p>
          <p>
            <a href="#" className="txt-link">
              .txt-link: This is a link.
            </a>{" "}
            Hover for <code className="bkg-gry-100">--clr-txt-link-hover</code>.
          </p>
          <p className="txt-prm">.txt-prm: Primary brand color text.</p>
          <p className="txt-sec">.txt-sec: Secondary brand color text.</p>
          <p className="txt-acc">.txt-acc: Accent color text.</p>
          <p className="txt-sxs bkg-sxs-lht p-1 rounded">.txt-sxs: Success text (e.g., for alerts).</p>
          <p className="txt-wrn bkg-wrn-lht p-1 rounded">.txt-wrn: Warning text.</p>
          <p className="txt-dng bkg-dng-lht p-1 rounded">.txt-dng: Danger text.</p>
          <p className="txt-inf bkg-inf-lht p-1 rounded">.txt-inf: Info text (color needs update).</p>
          <p className="txt-wht bkg-blk p-2 rounded">.txt-wht (on black background)</p>
          <p className="txt-blk bkg-wht p-2 rounded border">.txt-blk (on white background)</p>
          <p className="txt-gry-500">.txt-gry-500: A specific gray shade for text.</p>
          <p className="txt-none">.txt-none (color: none; Invalid)</p>
        </div>
        <UtilityDescription
          title="Text Color Utilities"
          items={[
            { class: "txt-dark", property: "--clr-txt-dark" },
            { class: "txt-prm", property: "--clr-prm" },
            { class: "txt-gry-500", property: "--clr-gry-500" },
            { class: "txt-link", property: "--clr-txt-link" },
            { class: "txt-none", property: "none (invalid)", notes: "Should be transparent, inherit, or initial" },
          ]}
        />
      </section>

      {/* Layout Utilities Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdSpaceDashboard className="mr-3" /> Layout Utilities
        </h2>
        <div className="bkg-elm p-6 rounded-lg shadow">
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 txt-sec flex items-center">
              <MdGridOn className="mr-2" /> .flex and .grid
            </h4>
            <div className="flex bkg-gry-100 p-2 rounded mb-2" style={{ "--gap": "0.5rem" } as React.CSSProperties}>
              <div className="bkg-prm txt-wht p-2 rounded">Flex Item 1</div>
              <div className="bkg-sec txt-wht p-2 rounded">Flex Item 2</div>
              <div className="bkg-acc txt-wht p-2 rounded">Flex Item 3</div>
            </div>
            <div
              className="grid grid-cols-3 bkg-gry-100 p-2 rounded"
              style={{ "--gap": "0.5rem" } as React.CSSProperties}
            >
              <div className="bkg-prm txt-wht p-2 rounded">Grid Item 1</div>
              <div className="bkg-sec txt-wht p-2 rounded">Grid Item 2</div>
              <div className="bkg-acc txt-wht p-2 rounded">Grid Item 3</div>
            </div>
            <p className="txt-muted text-sm mt-1">
              Uses <code className="bkg-gry-100">--gap</code> custom property (default 1rem).
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 txt-sec flex items-center">
              <MdViewQuilt className="mr-2" /> .container
            </h4>
            <div className="container bkg-gry-100 p-4 rounded">
              <p className="txt-dark">
                This content is inside a <code className="bkg-gry-200 p-0.5 rounded">.container</code>. It has max-width
                and auto horizontal margins.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2 txt-sec">.sr-only (Screen Reader Only)</h4>
            <p className="txt-dark">
              The following text is visually hidden but accessible to screen readers:{" "}
              <span className="sr-only">This is a screen-reader only message.</span> (Inspect element to see it)
            </p>
          </div>
          <UtilityDescription
            title="Layout Utilities"
            items={[
              { class: "flex", property: "display: flex; gap: var(--gap, 1rem);" },
              { class: "grid", property: "display: grid; gap: var(--gap, 1rem);" },
              { class: "container", property: "padding-inline: 2em; margin-inline: auto; max-width: 80rem;" },
              { class: "sr-only", property: "position: absolute; ... clip: rect(0,0,0,0);" },
            ]}
          />
        </div>
      </section>

      {/* Spacing Utilities Section */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdFormatLineSpacing className="mr-3" /> Spacing
        </h2>
        <div className="bkg-elm p-6 rounded-lg shadow">
          <div className="mb-4 spacing" style={{ "--flow-space": "0.5rem" } as React.CSSProperties}>
            <h4 className="text-lg font-medium txt-sec">.spacing utility</h4>
            <div className="bkg-prm-lht p-2 rounded txt-prm-drk">This is the first child.</div>
            <div className="bkg-prm-lht p-2 rounded txt-prm-drk">
              This is the second child, with margin-top from <code className="bkg-gry-100">.spacing</code>.
            </div>
            <div className="bkg-prm-lht p-2 rounded txt-prm-drk">This is the third child, also with margin-top.</div>
            <p className="txt-muted text-sm">
              The <code className="bkg-gry-100">.spacing</code> class adds{" "}
              <code className="bkg-gry-100">margin-top: var(--flow-space, 1rem)</code> to children except the first.
            </p>
          </div>
          <UtilityDescription
            title="Spacing Utilities"
            items={[
              { class: "spacing > *:where(:not(:first-child))", property: "margin-top: var(--flow-space, 1rem);" },
            ]}
          />
          <UtilityDescription
            title="Missing Spacing Utilities (Recommended)"
            items={[
              {
                class: "m-1, mx-1, my-1, mt-1, ...",
                property: "--space-1: 0.25rem; (example scale)",
                notes: "Margin utilities",
              },
              {
                class: "p-1, px-1, py-1, pt-1, ...",
                property: "--space-1: 0.25rem; (example scale)",
                notes: "Padding utilities",
              },
            ]}
          />
        </div>
      </section>

      {/* Placeholder for Missing Utilities */}
      <section>
        <h2
          className="text-3xl font-semibold mb-6 txt-prm flex items-center"
          style={{ fontFamily: "var(--ff-heading)" }}
        >
          <MdBorderColor className="mr-3" /> Borders & Shadows (Missing Utilities)
        </h2>
        <div className="bkg-elm p-6 rounded-lg shadow">
          <p className="txt-muted mb-4">
            Currently, there are no dedicated utility classes for borders (radius, width, color) or box shadows. These
            would be beneficial additions.
          </p>
          <UtilityDescription
            title="Missing Border & Shadow Utilities (Recommended)"
            items={[
              {
                class: "rounded-sm, rounded-md, rounded-lg, rounded-full",
                property: "--radius-md: 0.25rem;",
                notes: "Border radius",
              },
              {
                class: "border, border-prm, border-2",
                property: "--border-width: 1px; --clr-border: var(--clr-dvd);",
                notes: "Border width & color",
              },
              {
                class: "shadow-sm, shadow-md, shadow-lg",
                property: "--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);",
                notes: "Box shadows",
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
};

export default ThemeTestPage;
