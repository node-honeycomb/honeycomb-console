import * as React from 'react';

interface Meta {
  meta:{
    [props: string]: any
  }
}

declare enum AppType {
  'app', 'server'
}

interface Props{
  getAppList: (option: { clusterCode: string }) => Promise<{}>;
  getAppsConfig: (option1: { clusterCode: string, type: AppType}, option2: { appId: string} ) => Promise<{}>;
  clusterMeta: Meta,
  onFinish: () => void
}

interface Block{
  config: object;
  cluster: string | null;
  app: string | null;
  merge: boolean;
  backup: object;
}

interface States{
  cluster: {
    name: string;
    code: string;
  }[];
  toButton: number;
  origin: Block;
  compare: Block;
  loading: boolean;
}

declare class ConfigDiff extends React.Component<Props, States>{}

export default ConfigDiff;