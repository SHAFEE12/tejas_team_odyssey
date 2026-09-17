import { useState } from 'react';
import useScrollReveal from './useScrollReveal';

export default function AIAssistant({ onRegister }) {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  const conversationScenarios = [
    {
      prompt: 'What skills are missing for a Cloud Systems role?',
      userQuery: 'What skills should I prioritize to qualify for a Cloud Infrastructure Engineer role?',
      response: 'Based on your diagnostic profile and verified coursework, you have strong foundations in Operating Systems and Relational Databases. The primary competency gaps identified are: (1) Container Orchestration with Kubernetes, and (2) Infrastructure as Code with Terraform. I recommend dedicating your next 4-week sprint to deploying a multi-service Helm chart on an active cloud cluster.'
    },
    {
      prompt: 'How do I optimize my capstone for recruiter ATS?',
      userQuery: 'How should I phrase my university capstone project on my resume to pass ATS scans?',
      response: 'Avoid passive descriptions like "Helped make a backend app." Instead, use quantified STAR bullet points: "Architected event-driven microservices processing asynchronous tasks with RabbitMQ and Redis caching, documented with OpenAPI specs and tested with 85%+ coverage." This highlights system complexity and passes ATS keyword scans for distributed backend roles.'
    },
     {
      prompt: 'Which capstone project will impress hiring managers?',
      userQuery: 'Which capstone project should I build this semester to stand out to enterprise engineering teams?',
      response: 'Rather than another generic e-commerce clone, build a high-concurrency distributed cache or a custom Kubernetes operator with automated reconciliation loops. Enterprise recruiters look for proof that you can think about fault-tolerance, idempotency, and network latency in production environments.'
    }
  ];