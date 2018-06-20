import * as React from 'react';

interface Cluster{
  name: string;
  code: string;
}
interface App{
  name: string;
}

declare enum AppType {
  'app', 'server'
}

interface Props{
  clusters: Cluster[];
  getAppList: (option: { clusterCode: string }) => Promise<{}>;
  getAppsConfig: (option1: { clusterCode: string, type: AppType}, option2: { appId: string} ) => Promise<{}>;  
  onGetConfig: (config: string, clusterCode: string, appId: string) => void;
  defaultCluster: string;
  onRequest: (request: Promise<{}>) => void
}

interface States{
  apps: App[];
  clusterCode: string | null;
  defaultApp: string | null;
}

declare class AppSelector extends React.Component<Props, States>{}

export default AppSelector;