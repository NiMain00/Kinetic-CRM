import { useQuery } from '@tanstack/react-query';
import { configService } from '../../services/config';

export function useConfig(section: string) {
  return useQuery({
    queryKey: ['config', section],
    queryFn: () => {
      switch (section) {
        case 'organization': return configService.getOrganization();
        case 'workflow': return configService.getWorkflow();
        case 'sla': return configService.getSla();
        case 'notifications': return configService.getNotificationTemplates();
        case 'question-types': return configService.getQuestionTypes();
        case 'upload-policy': return configService.getUploadPolicy();
        case 'integrations': return configService.getIntegrations();
        case 'roles': return configService.getRoles();
        case 'permissions': return configService.getPermissions();
        default: throw new Error(`Unknown config section: ${section}`);
      }
    },
    enabled: !!section,
  });
}
