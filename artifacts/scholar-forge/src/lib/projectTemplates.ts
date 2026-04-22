export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  defaultValues: {
    title: string;
    description: string;
    abstract: string;
    keywords: string[];
    status: string;
    visibility: string;
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'research-paper',
    name: 'Research Paper',
    description: 'Academic research paper with structured methodology',
    defaultValues: {
      title: '',
      description: 'This research paper investigates...',
      abstract: 'This study aims to explore the relationship between various factors in the context of modern research methodologies. The research will employ both qualitative and quantitative approaches to gather comprehensive data.',
      keywords: ['research', 'academic', 'methodology'],
      status: 'PLANNING',
      visibility: 'PRIVATE'
    }
  },
  {
    id: 'experimental-study',
    name: 'Experimental Study',
    description: 'Controlled experimental research project',
    defaultValues: {
      title: '',
      description: 'An experimental study to examine the effects of...',
      abstract: 'This experimental study employs a controlled methodology to investigate causal relationships between variables. The research design includes randomized controlled trials with appropriate statistical analysis.',
      keywords: ['experiment', 'research', 'methodology'],
      status: 'PLANNING',
      visibility: 'PRIVATE'
    }
  },
  {
    id: 'literature-review',
    name: 'Literature Review',
    description: 'Comprehensive literature analysis and synthesis',
    defaultValues: {
      title: '',
      description: 'A comprehensive literature review of existing research on...',
      abstract: 'This literature review systematically analyzes and synthesizes existing research on the topic. The review follows PRISMA guidelines and includes both quantitative and qualitative studies from peer-reviewed sources.',
      keywords: ['literature', 'review', 'synthesis'],
      status: 'PLANNING',
      visibility: 'PUBLIC'
    }
  },
  {
    id: 'collaborative-project',
    name: 'Collaborative Project',
    description: 'Multi-institution collaborative research initiative',
    defaultValues: {
      title: '',
      description: 'A collaborative research project bringing together expertise from multiple institutions...',
      abstract: 'This collaborative project brings together researchers from multiple institutions to address complex research questions. The project emphasizes interdisciplinary approaches and knowledge sharing across organizational boundaries.',
      keywords: ['collaboration', 'interdisciplinary', 'multi-institution'],
      status: 'SEEKING_COLLABORATORS',
      visibility: 'PUBLIC'
    }
  }
];

export function getProjectTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(template => template.id === id);
}

export function applyProjectTemplate(template: ProjectTemplate): any {
  return {
    title: template.defaultValues.title,
    description: template.defaultValues.description,
    abstract: template.defaultValues.abstract,
    keywords: template.defaultValues.keywords.join(', '),
    status: template.defaultValues.status,
    visibility: template.defaultValues.visibility
  };
}
