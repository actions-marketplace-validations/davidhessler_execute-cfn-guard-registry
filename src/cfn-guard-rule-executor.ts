import * as core from '@actions/core'
// import * as shell from 'shelljs'
import * as exec from '@actions/exec'

// eslint-disable-next-line no-shadow
export enum OutputFormat {
  JSON = 'JSON',
  SINGLE_LINE_SUMMARY = 'SINGLE_LINE_SUMMARY'
}

export class CfnGuardRuleExecutor {
  async install(): Promise<void> {
    await exec.exec(
      "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    )
    await exec.exec('source "$HOME/.cargo/env" && cargo install cfn-guard')
    const ret = await exec.exec(
      'source "$HOME/.cargo/env" && cfn-guard --version'
    )
    if (ret !== 0) {
      core.setFailed(`Unable to install cfn-guard: ${JSON.stringify(ret)}`)
    }
  }

  async validate(
    rulesPath: string,
    templatesPath: string,
    output: OutputFormat
  ): Promise<void> {
    let cmd = `source "$HOME/.cargo/env" && cfn-guard validate --data ${templatesPath} --rules ${rulesPath}`
    core.debug(cmd)
    switch (output) {
      case OutputFormat.JSON:
        cmd += ' --output-format json'
        break
      case OutputFormat.SINGLE_LINE_SUMMARY:
      default:
        cmd += ' --output-format single-line-summary'
        break
    }
    const result = await exec.exec(cmd)
    if (result === 5) {
      core.setFailed('CloudFormation Guard detected an error')
    }
  }
}
