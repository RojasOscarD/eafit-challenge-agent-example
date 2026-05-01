import * as k8s from '@kubernetes/client-node';
import * as yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const KUBECONFIG_PATH = process.env.KUBECONFIG_PATH || '../team_g_kubeconfig.yaml';
const NAMESPACE = process.env.K8S_NAMESPACE || 'team-g';
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'agents.team-g.teams.eafit.testnet.verana.network';
const CREDENTIAL_DEFINITION_ID = process.env.CREDENTIAL_DEFINITION_ID || '';

let kc: k8s.KubeConfig;
let k8sApi: k8s.CoreV1Api;
let k8sAppsApi: k8s.AppsV1Api;

function initK8s() {
  if (!kc) {
    kc = new k8s.KubeConfig();
    const kubeconfigPath = path.resolve(KUBECONFIG_PATH);
    if (fs.existsSync(kubeconfigPath)) {
      kc.loadFromFile(kubeconfigPath);
    } else {
      kc.loadFromCluster();
    }
    k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
  }
}

export function generateDeploymentYaml(bot: any): string {
  const safeId = bot.id || 'unknown';
  const safeSlug = bot.slug || 'unknown';
  const deploymentName = `bot-${safeSlug}`;
  const publicUrl = `https://${safeSlug}.${BASE_DOMAIN}`;
  
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: deploymentName,
      namespace: NAMESPACE,
      labels: {
        app: deploymentName,
        'bot-id': safeId,
        'managed-by': 'verana-agent-manager',
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: deploymentName,
        },
      },
      template: {
        metadata: {
          labels: {
            app: deploymentName,
          },
        },
        spec: {
          containers: [
            {
              name: 'chatbot',
              image: 'io2060/hologram-generic-ai-agent-app:v1.11.2',
              ports: [
                { containerPort: 3003, name: 'http' },
              ],
              env: [
                { name: 'APP_PORT', value: '3003' },
                { name: 'LOG_LEVEL', value: '3' },
                { name: 'LLM_PROVIDER', value: 'openai' },
                { name: 'OPENAI_MODEL', value: bot.llm_model || 'gpt-5.4-mini' },
                { name: 'VECTOR_STORE', value: 'redis' },
                { name: 'VECTOR_INDEX_NAME', value: `bot_${safeId.replace(/-/g, '_')}` },
                { name: 'RAG_PROVIDER', value: 'langchain' },
                { name: 'RAG_DOCS_PATH', value: '/app/rag/docs' },
                { name: 'AGENT_MEMORY_BACKEND', value: 'redis' },
                { name: 'AGENT_MEMORY_WINDOW', value: '20' },
                { name: 'REDIS_URL', value: `redis://${deploymentName}-redis:6379` },
                { name: 'VS_AGENT_ADMIN_URL', value: `http://${deploymentName}-vs-agent:3000` },
                { name: 'POSTGRES_HOST', value: `${deploymentName}-postgres` },
                { name: 'CREDENTIAL_DEFINITION_ID', value: CREDENTIAL_DEFINITION_ID },
              ],
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '256Mi',
                },
                limits: {
                  cpu: '500m',
                  memory: '512Mi',
                },
              },
            },
          ],
        },
      },
    },
  };

  // Add MCP server env vars if configured
  const mcpServices = bot.mcp_services || [];
  if (mcpServices.includes('github')) {
    deployment.spec.template.spec.containers[0].env.push({
      name: 'GITHUB_MCP_URL',
      value: process.env.GITHUB_MCP_URL || 'https://api.githubcopilot.com/mcp/',
    });
  }

  return yaml.dump(deployment);
}

export function generateServiceYaml(bot: any): string {
  const deploymentName = `bot-${bot.slug}`;
  
  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: `${deploymentName}-chatbot`,
      namespace: NAMESPACE,
    },
    spec: {
      selector: {
        app: deploymentName,
      },
      ports: [
        {
          port: 3003,
          targetPort: 3003,
          name: 'http',
        },
      ],
      type: 'ClusterIP',
    },
  };

  return yaml.dump(service);
}

export function generateIngressYaml(bot: any): string {
  const deploymentName = `bot-${bot.slug}`;
  const publicUrl = `https://${bot.slug}.${BASE_DOMAIN}`;
  
  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: `${deploymentName}-ingress`,
      namespace: NAMESPACE,
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
      },
    },
    spec: {
      tls: [
        {
          hosts: [`${bot.slug}.${BASE_DOMAIN}`],
          secretName: `${deploymentName}-tls`,
        },
      ],
      rules: [
        {
          host: `${bot.slug}.${BASE_DOMAIN}`,
          http: {
            paths: [
              {
                path: '/',
                pathType: 'Prefix',
                backend: {
                  service: {
                    name: `${deploymentName}-chatbot`,
                    port: {
                      number: 3003,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };

  return yaml.dump(ingress);
}

export async function deployBot(bot: any): Promise<{ success: boolean; publicUrl: string; error?: string }> {
  try {
    initK8s();
    
    const deploymentName = `bot-${bot.slug}`;
    const publicUrl = `${bot.slug}.${BASE_DOMAIN}`;
    
    // In a real implementation, you would apply these manifests to Kubernetes
    // For this example, we'll simulate the deployment
    
    console.log('Deploying bot with manifests:');
    console.log('Deployment:', generateDeploymentYaml(bot));
    console.log('Service:', generateServiceYaml(bot));
    console.log('Ingress:', generateIngressYaml(bot));
    
    // Simulated success - in production, use k8sAppsApi.createNamespacedDeployment, etc.
    return {
      success: true,
      publicUrl: `https://${publicUrl}`,
    };
  } catch (error: any) {
    console.error('K8s deployment error:', error);
    return {
      success: false,
      publicUrl: '',
      error: error.message,
    };
  }
}

export async function undeployBot(bot: any): Promise<{ success: boolean; error?: string }> {
  try {
    initK8s();
    
    const deploymentName = `bot-${bot.slug}`;
    
    // In a real implementation:
    // await k8sAppsApi.deleteNamespacedDeployment(deploymentName, NAMESPACE);
    // await k8sApi.deleteNamespacedService(`${deploymentName}-chatbot`, NAMESPACE);
    
    console.log(`Undeploying bot: ${deploymentName}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('K8s undeployment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
