const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const {
  handleBranchesOption,
  handleDryRunOption,
  handleExtends,
} = require('./handleOptions');
const setUpJob = require('./setUpJob.task');
const installSpecifyingVersionSemantic = require('./installSpecifyingVersionSemantic.task');
const preInstall = require('./preInstall.task');
const cleanupNpmrc = require('./cleanupNpmrc.task');
const windUpJob = require('./windUpJob.task');
const inputs = require('./inputs.json');

/**
 * Release main task
 * @returns {Promise<void>}
 */
const release = async () => {
  await setUpJob();
  await installSpecifyingVersionSemantic();
  await preInstall(core.getInput(inputs.extra_plugins));
  await preInstall('semantic-release-monorepo @semantic-release/exec');

  const ws = process.env.GITHUB_WORKSPACE;
  const wd = core.getInput(inputs.working_directory);
  const dir = path.join(ws, wd);

  const release_name = core.getInput(inputs.release_name);

  const pkgJson = path.join(dir, 'package.json');

  if (release_name) {
    core.debug(`DEBUG input Package release_name: ${release_name}`);

    const pkgContent = `
      {
        "name": "${release_name}"
      }
    `;
    fs.writeFileSync(pkgJson, pkgContent);
  } else if (!fs.existsSync(pkgJson)) {
    const baseName = path.basename(pkgJson);
    const pkgContent = `
      {
        "name": "${baseName}"
      }
    `;
    fs.writeFileSync(pkgJson, pkgContent);
  }


  const semanticRelease = require('semantic-release');
  const result = await semanticRelease({
    ...handleBranchesOption(),
    ...handleDryRunOption(),
    ...handleExtends(),
  }, {
    cwd: dir,
  });

  await cleanupNpmrc();
  await windUpJob(result);
};

module.exports = () => {
  core.debug('Initialization successful');

  release().catch(core.setFailed);
};
