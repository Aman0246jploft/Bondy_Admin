module.exports = {
  apps: [
    {
      name: "Bondy_Admin_8082",
      script: "npx",
      args: "serve -s dist -l 8082",
      cwd: "/var/www/html/Bondy/Bondy_Admin"
    }
  ]
}