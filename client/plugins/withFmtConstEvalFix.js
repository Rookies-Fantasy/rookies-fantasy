const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const POST_INSTALL_PATCH = `
    # Fix for fmt consteval incompatibility with Xcode 16 / Clang 16.
    fmt_pod_root = File.join(installer.sandbox.root.to_s, "fmt")
    if Dir.exist?(fmt_pod_root)
      Dir.glob(File.join(fmt_pod_root, "**", "*.{h,cc}")).each do |f|
        content = File.read(f)
        unless content.start_with?("// xcode16-fix\\n")
          patch = "// xcode16-fix\\n" \\
                  "#undef FMT_USE_CONSTEVAL\\n#define FMT_USE_CONSTEVAL 0\\n" \\
                  "#undef FMT_CONSTEVAL\\n#define FMT_CONSTEVAL constexpr\\n" \\
                  "#undef FMT_STRING\\n#define FMT_STRING(s) s\\n"
          File.write(f, patch + content)
        end
      end
    end
`;

const withFmtConstEvalFix = (config) =>
  withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );

      let podfile = fs.readFileSync(podfilePath, "utf8");

      if (podfile.includes("xcode16-fix")) {
        return config;
      }

      // Insert after the closing paren of react_native_post_install(...)
      const anchor = "react_native_post_install(";
      const anchorIdx = podfile.indexOf(anchor);
      if (anchorIdx === -1) {
        console.warn(
          "[withFmtConstEvalFix] Could not find react_native_post_install in Podfile",
        );
        return config;
      }

      let depth = 0;
      let i = anchorIdx + anchor.length - 1;
      for (; i < podfile.length; i++) {
        if (podfile[i] === "(") depth++;
        else if (podfile[i] === ")") {
          depth--;
          if (depth === 0) break;
        }
      }

      const lineEnd = podfile.indexOf("\n", i);
      if (lineEnd === -1) {
        console.warn("[withFmtConstEvalFix] Unexpected Podfile format");
        return config;
      }

      podfile =
        podfile.slice(0, lineEnd + 1) +
        POST_INSTALL_PATCH +
        podfile.slice(lineEnd + 1);

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);

module.exports = withFmtConstEvalFix;
