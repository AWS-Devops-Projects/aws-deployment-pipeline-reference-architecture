import * as fs from 'fs';
import { IgnoreMode } from 'aws-cdk-lib';
import { Code, Repository } from 'aws-cdk-lib/aws-codecommit';
import { CfnRepositoryAssociation } from 'aws-cdk-lib/aws-codegurureviewer';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

export interface CodeCommitSourceProps {
  repositoryName: string;
  trunkBranchName?: string;
  associateCodeGuru?: boolean;
}

export class CodeCommitSource extends Construct {
  repository: Repository;
  trunkBranchName: string;
  codePipelineSource: CodePipelineSource;
  constructor(scope: Construct, id: string, props: CodeCommitSourceProps) {
    super(scope, id);
    this.trunkBranchName = props?.trunkBranchName || 'main';
    const gitignore = fs.readFileSync('.gitignore').toString().split(/\r?\n/);
    gitignore.push('.git/');
    const codeAsset = new Asset(this, 'SourceAsset', {
      path: '.',
      ignoreMode: IgnoreMode.GIT,
      exclude: gitignore,
      assetHash: 'initial',
    });
    this.repository = new Repository(this, 'CodeCommitRepo', {
      repositoryName: props.repositoryName,
      code: Code.fromAsset(codeAsset, this.trunkBranchName),
    });

    if (props.associateCodeGuru !== false) {
      new CfnRepositoryAssociation(this, 'CfnRepositoryAssociation', {
        name: this.repository.repositoryName,
        type: 'CodeCommit',
      });
    }
    this.codePipelineSource = CodePipelineSource.codeCommit(this.repository, this.trunkBranchName);
  }
}


