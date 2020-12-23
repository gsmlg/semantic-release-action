const core = require('@actions/core');
const path = require('path');
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
  await preInstall(core.getInput(inputs.extends));

  const semanticRelease = require('semantic-release');
  const result = await semanticRelease({
    ...handleBranchesOption(),
    ...handleDryRunOption(),
    ...handleExtends(),
  });

  await cleanupNpmrc();
  await windUpJob(result);
};

module.exports = () => {
  core.debug('Initialization successful');

  const cwd = process.cwd();
  const wd = core.getInput(inputs.working_directory);
  const dir = path.join(cwd, dir);

  core.debug(`Change working directory to ${dir}`);
  process.chdir(dir);

  release().catch(core.setFailed);
};
