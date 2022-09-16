module.exports = {
  "globDirectory": "public\\",
  "globPatterns": [
    "**/*.{ico,html,json,js,css}",
    "src/assets/images/*.{jpg,png}"
  ],
  "swSrc": "public/sw-base.js",
  "swDest": "public/service-worker.js",
  "globIgnores": [
    "..\\workbox-cli-config.js",
    "help/**"
  ]
};
