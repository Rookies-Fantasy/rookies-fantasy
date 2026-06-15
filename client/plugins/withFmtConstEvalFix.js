const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

// Sets FMT_USE_CONSTEVAL=0 as a compiler define on the fmt pod target.
// fmt/core.h guards its definition with #ifndef FMT_USE_CONSTEVAL, so a
// GCC_PREPROCESSOR_DEFINITIONS entry prevents the consteval path entirely.
// This is more reliable than file-patching (headers re-define macros after
// any prepended #defines).
const POST_INSTALL_PATCH = `
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |cfg|
        defs = Array(cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)'])
        unless defs.any? { |d| d.to_s.include?('FMT_USE_CONSTEVAL') }
          cfg.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs + ['FMT_USE_CONSTEVAL=0']
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

      if (podfile.includes("FMT_USE_CONSTEVAL")) {
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
