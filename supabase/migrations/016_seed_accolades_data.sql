-- Migration: 016_seed_accolades_data
-- Created: 2025
-- Description: Seed accolades data for all categories

-- =============================================
-- LEVEL 1 ACCOLADES (Accolade Types) - parent_id = null
-- =============================================

-- A - XR Healthcare Solution
INSERT INTO accolades (code, name, sort_order) VALUES
('A-A', 'Patient Care and Treatment', 1),
('A-B', 'Medical Training and Education', 2),
('A-C', 'Mental Health and Psychological Therapies', 3),
('A-D', 'Diagnostic and Imaging Tools', 4),
('A-E', 'Healthcare Management and Support', 5);

-- B - XR Education & Training
INSERT INTO accolades (code, name, sort_order) VALUES
('B-A', 'Business Sector Applications', 1),
('B-B', 'Educational Sector Applications', 2),
('B-C', 'Specialized Training Applications', 3),
('B-D', 'Interactive and Collaborative Learning Applications', 4),
('B-E', 'Accessibility and Inclusive Learning Applications', 5);

-- C - XR Enterprise Solution
INSERT INTO accolades (code, name, sort_order) VALUES
('C-A', 'Design, Visualization, and Prototyping', 1),
('C-B', 'Business Operations and Workflow Optimization', 2),
('C-C', 'Collaboration and Remote Working', 3),
('C-D', 'Data Visualization and Analysis', 4),
('C-E', 'Customer Experience and Service Innovation', 5);

-- D - XR Tool & Utility
INSERT INTO accolades (code, name, sort_order) VALUES
('D-A', 'Content Creation and Development Tools', 1),
('D-B', 'Distribution, Streaming, and Publishing', 2),
('D-C', 'Performance Optimization and User Feedback', 3),
('D-D', 'Practical Utility and Everyday Applications', 4),
('D-E', 'Integration, Interoperability, and Cloud Solutions', 5);

-- E - AIXR Social Impact Award
INSERT INTO accolades (code, name, sort_order) VALUES
('E-A', 'Community Development and Welfare', 1),
('E-B', 'Cultural and Historical Preservation', 2),
('E-C', 'Humanitarian Aid and Crisis Management', 3),
('E-D', 'Social Awareness and Change', 4),
('E-E', 'Inclusivity and Empowerment', 5);

-- F - Rising XR Company
INSERT INTO accolades (code, name, sort_order) VALUES
('F-A', 'Innovation and Product Development', 1),
('F-B', 'Growth and Market Strategy', 2),
('F-C', 'Community and Industry Engagement', 3),
('F-D', 'Business Viability and Management', 4),
('F-E', 'Vision and Future Potential', 5);

-- G - Outstanding XR Company (Obsidian Award)
INSERT INTO accolades (code, name, sort_order) VALUES
('G-A', 'Industry Leadership and Influence', 1),
('G-B', 'Business Growth and Expansion', 2),
('G-C', 'Customer Engagement and Product Excellence', 3),
('G-D', 'Contribution to the XR Ecosystem', 4),
('G-E', 'Corporate Responsibility and Ethical Practices', 5),
('G-F', 'Vision and Future Preparedness', 6);

-- H - XR Location-Based Experience
INSERT INTO accolades (code, name, sort_order) VALUES
('H-A', 'Entertainment and Gaming Centers', 1),
('H-B', 'Cultural and Historical Experiences', 2),
('H-C', 'Public Spaces and Events', 3),
('H-D', 'Retail and Commercial Spaces', 4),
('H-E', 'Theme Park and Amusement Attractions', 5);

-- I - XR Marketing Campaign
INSERT INTO accolades (code, name, sort_order) VALUES
('I-A', 'Brand Engagement and Product Promotion', 1),
('I-B', 'Major Brand Implementations in XR', 2),
('I-C', 'Event and Experience Marketing', 3),
('I-D', 'Immersive Advertising and Content', 4);

-- J - XR Film & Experience
INSERT INTO accolades (code, name, sort_order) VALUES
('J-A', 'Narrative and Storytelling', 1),
('J-B', 'Experimental and Artistic Content', 2),
('J-C', 'Immersive Environments and Virtual Worlds', 3),
('J-D', 'Social, Cultural, and Personal Narratives', 4);

-- K - XR Peripheral Hardware
INSERT INTO accolades (code, name, sort_order) VALUES
('K-A', 'Input and Interaction Devices', 1),
('K-B', 'Wearable and Immersive Accessories', 2),
('K-C', 'Environmental and Spatial Enhancements', 3),
('K-D', 'Display and Projection Enhancements', 4),
('K-E', 'Audio and Communication Devices', 5),
('K-F', 'Utility Accessories and Enhancements', 6);

-- L - XR HMD
INSERT INTO accolades (code, name, sort_order) VALUES
('L-A', 'Virtual Reality (VR) Headsets', 1),
('L-B', 'Augmented Reality (AR) Headsets', 2),
('L-C', 'Mixed Reality (MR) Headsets', 3);

-- M - XR Game
INSERT INTO accolades (code, name, sort_order) VALUES
('M-A', 'Platform-Specific Games', 1),
('M-B', 'Gameplay and Experience Diversity', 2),
('M-C', 'Game Scale and Development Type', 3),
('M-D', 'Special Categories', 4);

-- N - XR Content Creator
INSERT INTO accolades (code, name, sort_order) VALUES
('N-A', 'Platform-Specific Content Creators', 1),
('N-B', 'Content Focus and Style', 2),
('N-C', 'Community Engagement and Growth', 3);

-- =============================================
-- LEVEL 2 ACCOLADES (Individual Accolades)
-- =============================================

-- A-A: Patient Care and Treatment
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'A-A'), 'A-A01', 'Surgical Planning and Assistance', 'XR tools for pre-operative planning, surgical simulations, and intraoperative guidance.', 1),
((SELECT id FROM accolades WHERE code = 'A-A'), 'A-A02', 'Rehabilitation and Physical Therapy', 'Interactive XR applications for patient rehabilitation, physical therapy, and motor skill recovery.', 2),
((SELECT id FROM accolades WHERE code = 'A-A'), 'A-A03', 'Chronic Pain Management', 'Solutions leveraging XR for pain distraction, management, and alternative therapy.', 3),
((SELECT id FROM accolades WHERE code = 'A-A'), 'A-A04', 'Patient Education and Engagement', 'Tools for enhancing patient understanding of medical conditions, treatments, and health literacy.', 4),
((SELECT id FROM accolades WHERE code = 'A-A'), 'A-A05', 'Wearable XR Technologies', 'Wearable devices and solutions that integrate XR for continuous health monitoring and patient engagement.', 5);

-- A-B: Medical Training and Education
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'A-B'), 'A-B01', 'Medical Procedure Training', 'Advanced simulations for training medical students and professionals in surgical techniques and medical procedures.', 1),
((SELECT id FROM accolades WHERE code = 'A-B'), 'A-B02', 'Anatomy and Physiology Visualization', 'XR applications for detailed and interactive exploration of human anatomy and physiological processes.', 2),
((SELECT id FROM accolades WHERE code = 'A-B'), 'A-B03', 'Emergency Response Medical Training', 'Simulated environments for training in emergency medicine, critical care, and first responder medical scenarios.', 3),
((SELECT id FROM accolades WHERE code = 'A-B'), 'A-B04', 'Mental Health Professional Training', 'Tools for training healthcare providers in psychiatric evaluation, therapy techniques, and patient interaction.', 4);

-- A-C: Mental Health and Psychological Therapies
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'A-C'), 'A-C01', 'Therapeutic XR for Mental Health', 'XR solutions for treating conditions like PTSD, anxiety, and depression.', 1),
((SELECT id FROM accolades WHERE code = 'A-C'), 'A-C02', 'Cognitive Behavioral Therapy Applications', 'XR tools to deliver cognitive-behavioural therapy and other psychological treatments.', 2),
((SELECT id FROM accolades WHERE code = 'A-C'), 'A-C03', 'Mindfulness and Relaxation', 'Applications focused on stress reduction, relaxation, and mindfulness training.', 3),
((SELECT id FROM accolades WHERE code = 'A-C'), 'A-C04', 'Social Skills Training for Autism Spectrum Disorders', 'XR solutions to help individuals with autism develop communication and social interaction skills.', 4);

-- A-D: Diagnostic and Imaging Tools
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'A-D'), 'A-D01', 'Enhanced Medical Imaging', 'XR applications that augment medical imaging for better diagnosis and treatment planning.', 1),
((SELECT id FROM accolades WHERE code = 'A-D'), 'A-D02', 'Virtual Patient Observation', 'Tools for remote patient monitoring and diagnostics through XR technologies.', 2),
((SELECT id FROM accolades WHERE code = 'A-D'), 'A-D03', '3D Modeling for Diagnosis', 'Solutions that use 3D modelling and visualisation to aid in medical diagnosis and treatment planning.', 3);

-- A-E: Healthcare Management and Support
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'A-E'), 'A-E01', 'XR in Hospital Management', 'Applications for managing hospital operations, training staff, and enhancing healthcare delivery.', 1),
((SELECT id FROM accolades WHERE code = 'A-E'), 'A-E02', 'Telemedicine and Remote Consultations', 'Tools that use XR for remote medical consultations, patient monitoring, and telehealth services.', 2),
((SELECT id FROM accolades WHERE code = 'A-E'), 'A-E03', 'Accessibility and Assistive Technologies', 'XR solutions that enhance healthcare accessibility for patients with disabilities.', 3),
((SELECT id FROM accolades WHERE code = 'A-E'), 'A-E04', 'Data Visualization and Management', 'Applications that utilise XR for visualising and managing complex medical data and patient information.', 4);

-- B-A: Business Sector Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'B-A'), 'B-A01', 'Corporate Skill Development', 'Solutions for business soft skills training, including leadership, teamwork, and management simulations.', 1),
((SELECT id FROM accolades WHERE code = 'B-A'), 'B-A02', 'Industry-Specific Training', 'Customised applications for specific industries, such as finance, law, or hospitality, emphasising role-specific scenarios.', 2),
((SELECT id FROM accolades WHERE code = 'B-A'), 'B-A03', 'Safety and Compliance Training', 'XR tools focused on workplace safety, hazard identification, and regulatory compliance training.', 3),
((SELECT id FROM accolades WHERE code = 'B-A'), 'B-A04', 'Sales and Customer Service Training', 'Interactive training modules for sales techniques, customer interaction, and service excellence.', 4);

-- B-B: Educational Sector Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'B-B'), 'B-B01', 'K-12 Education', 'Solutions tailored for primary and secondary education, including interactive learning modules, virtual field trips, and STEM education tools.', 1),
((SELECT id FROM accolades WHERE code = 'B-B'), 'B-B02', 'Higher Education', 'Applications for universities and colleges, focusing on immersive learning, complex subject matter visualisation, and remote collaboration.', 2),
((SELECT id FROM accolades WHERE code = 'B-B'), 'B-B03', 'Vocational Training', 'XR tools for skill-based training, including trade skills, craftsmanship, and practical hands-on training simulations.', 3),
((SELECT id FROM accolades WHERE code = 'B-B'), 'B-B04', 'Adult and Continuing Education', 'Solutions for lifelong learning, professional development, and adult education, incorporating flexible and self-paced learning modules.', 4);

-- B-C: Specialized Training Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'B-C'), 'B-C01', 'Healthcare and Medical Training', 'Advanced simulations for medical procedures, patient interaction, and healthcare protocol training.', 1),
((SELECT id FROM accolades WHERE code = 'B-C'), 'B-C02', 'Emergency Response and Military Training', 'XR applications for high-stakes environments, including emergency response, military tactics, and crisis management.', 2),
((SELECT id FROM accolades WHERE code = 'B-C'), 'B-C03', 'Language and Cultural Training', 'Tools for language acquisition, cultural sensitivity training, and global communication skills.', 3),
((SELECT id FROM accolades WHERE code = 'B-C'), 'B-C04', 'Industry-Specific Simulations', 'Detailed simulations for practical training in fields like aviation, engineering, and architecture.', 4),
((SELECT id FROM accolades WHERE code = 'B-C'), 'B-C05', 'Virtual Labs and Experiments', 'Virtual environments for conducting scientific experiments and research in a safe, controlled setting.', 5);

-- B-D: Interactive and Collaborative Learning Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'B-D'), 'B-D01', 'Interactive Courseware', 'Engaging and interactive learning content, including 3D models, interactive quizzes, and virtual labs.', 1),
((SELECT id FROM accolades WHERE code = 'B-D'), 'B-D02', 'Collaborative Learning Environments', 'Platforms for remote collaboration, group projects, and virtual classrooms, fostering teamwork and discussion.', 2),
((SELECT id FROM accolades WHERE code = 'B-D'), 'B-D03', 'Gamified Learning Experiences', 'Applications utilising game mechanics to motivate, engage, and reinforce learning concepts.', 3),
((SELECT id FROM accolades WHERE code = 'B-D'), 'B-D04', 'Mixed Reality Experiences', 'Blending physical and digital learning environments for a seamless educational experience.', 4);

-- B-E: Accessibility and Inclusive Learning Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'B-E'), 'B-E01', 'Accessible Learning Solutions', 'Tools designed for learners with disabilities, including adaptive interfaces and assistive technologies.', 1),
((SELECT id FROM accolades WHERE code = 'B-E'), 'B-E02', 'Special Needs Education', 'Customised learning experiences for individuals with specific educational needs, including autism spectrum disorders or learning disabilities.', 2),
((SELECT id FROM accolades WHERE code = 'B-E'), 'B-E03', 'Multilingual Education', 'Applications offering content in multiple languages, accommodating non-native speakers and promoting language diversity.', 3),
((SELECT id FROM accolades WHERE code = 'B-E'), 'B-E04', 'AI-Enhanced Learning', 'Applications leveraging artificial intelligence for personalised learning paths, adaptive feedback, and intelligent tutoring systems.', 4);

-- C-A: Design, Visualization, and Prototyping
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'C-A'), 'C-A01', 'Industry-Specific Design and Simulation', 'XR tools specialised for sectors like automotive, aerospace, and more, for design, simulation, and prototyping.', 1),
((SELECT id FROM accolades WHERE code = 'C-A'), 'C-A02', 'Architectural and Spatial Planning', 'Applications for architectural visualisation, spatial planning, real estate, and urban development.', 2),
((SELECT id FROM accolades WHERE code = 'C-A'), 'C-A03', 'Product and Process Innovation', 'XR solutions aiding in product development, process optimization, and manufacturing across various industries.', 3);

-- C-B: Business Operations and Workflow Optimization
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'C-B'), 'C-B01', 'Workflow Enhancement and Efficiency', 'XR tools designed to streamline business processes, enhance workflow efficiency, and facilitate task management.', 1),
((SELECT id FROM accolades WHERE code = 'C-B'), 'C-B02', 'Supply Chain and Logistics Management', 'XR applications for optimising logistics operations, supply chain visualisation, and inventory management.', 2),
((SELECT id FROM accolades WHERE code = 'C-B'), 'C-B03', 'Facility and Asset Management', 'XR solutions for facility layout planning, asset visualisation, and operational simulations.', 3);

-- C-C: Collaboration and Remote Working
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'C-C'), 'C-C01', 'Virtual Collaboration and Meeting Platforms', 'XR solutions enabling remote team collaboration, virtual meetings, and digital workspaces.', 1),
((SELECT id FROM accolades WHERE code = 'C-C'), 'C-C02', 'Remote Project Management', 'Tools for managing projects, coordinating teams, and tracking progress in a virtual environment.', 2),
((SELECT id FROM accolades WHERE code = 'C-C'), 'C-C03', 'Global Business Integration', 'XR applications facilitating international business operations, cross-border collaborations, and cultural integrations.', 3);

-- C-D: Data Visualization and Analysis
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'C-D'), 'C-D01', 'Data Visualization Tools', 'XR platforms for visualising complex data sets, business analytics, and decision-making processes.', 1),
((SELECT id FROM accolades WHERE code = 'C-D'), 'C-D02', 'Risk Assessment and Management', 'XR applications for risk visualisation, scenario planning, and strategic decision support.', 2),
((SELECT id FROM accolades WHERE code = 'C-D'), 'C-D03', 'Market and Consumer Insights', 'Tools leveraging XR for understanding market trends, consumer behaviour, and competitive analysis.', 3);

-- C-E: Customer Experience and Service Innovation
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'C-E'), 'C-E01', 'Product Demonstration and Exploration', 'XR applications for immersive product exploration, virtual showrooms, and interactive demos.', 1),
((SELECT id FROM accolades WHERE code = 'C-E'), 'C-E02', 'Customer Interaction and Engagement', 'Solutions using XR to enhance customer interaction, engagement, and service delivery.', 2),
((SELECT id FROM accolades WHERE code = 'C-E'), 'C-E03', 'Virtual Event Hosting', 'XR platforms for hosting virtual events, conferences, and trade shows.', 3),
((SELECT id FROM accolades WHERE code = 'C-E'), 'C-E04', 'Wearable and Portable XR Technologies', 'Innovative wearable devices integrating XR for on-the-go business applications and field operations.', 4);

-- D-A: Content Creation and Development Tools
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'D-A'), 'D-A01', 'Development Platforms', 'Tools and platforms that enable the creation and development of XR content, offering robust features and flexibility.', 1),
((SELECT id FROM accolades WHERE code = 'D-A'), 'D-A02', 'Design and Visualization Tools', 'Software for XR design, modelling, and visualisation, aiding in the creation of immersive environments.', 2),
((SELECT id FROM accolades WHERE code = 'D-A'), 'D-A03', 'Animation and Interactive Elements', 'Tools that facilitate the creation of animation and interactive elements within XR experiences.', 3),
((SELECT id FROM accolades WHERE code = 'D-A'), 'D-A04', 'Audio Creation and Integration Tools', 'Tools specifically for creating, editing, and integrating audio within XR environments.', 4);

-- D-B: Distribution, Streaming, and Publishing
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'D-B'), 'D-B01', 'XR Distribution and Publishing Platforms', 'Platforms that streamline the distribution and publication of XR content.', 1),
((SELECT id FROM accolades WHERE code = 'D-B'), 'D-B02', 'Content Management and Update Systems', 'Managing XR content lifecycle, including updates and version control.', 2),
((SELECT id FROM accolades WHERE code = 'D-B'), 'D-B03', 'Streaming and Broadcasting Applications', 'Tools and platforms for live streaming or broadcasting XR content, enhancing reach and engagement.', 3);

-- D-C: Performance Optimization and User Feedback
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'D-C'), 'D-C01', 'Performance Optimization Tools', 'Enhancing XR application performance for smoother, more efficient operation.', 1),
((SELECT id FROM accolades WHERE code = 'D-C'), 'D-C02', 'Debugging, Testing, and Quality Assurance', 'Software for debugging and testing XR applications, ensuring quality and reliability.', 2),
((SELECT id FROM accolades WHERE code = 'D-C'), 'D-C03', 'Real-time Analytics and User Feedback', 'Providing immediate analytics and user feedback to optimise XR experiences.', 3),
((SELECT id FROM accolades WHERE code = 'D-C'), 'D-C04', 'Customization, Mods and Personalization Utilities', 'Allowing users to customise and personalise their XR experiences.', 4);

-- D-D: Practical Utility and Everyday Applications
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'D-D'), 'D-D01', 'Utility and Assistance Tools', 'Applications that provide practical assistance in daily activities, like navigation, organisation, or task management within an XR environment.', 1),
((SELECT id FROM accolades WHERE code = 'D-D'), 'D-D02', 'Virtual Workspace and Productivity Tools', 'Tools that create virtual workspaces or enhance productivity, like virtual monitors or collaborative platforms in XR.', 2),
((SELECT id FROM accolades WHERE code = 'D-D'), 'D-D03', 'Lifestyle Integration and Enhancement Tools', 'Software that blends XR with everyday non-XR utilities for enhanced convenience and functionality.', 3);

-- D-E: Integration, Interoperability, and Cloud Solutions
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'D-E'), 'D-E01', 'Integration and Interoperability Tools', 'Facilitating the integration of XR technologies with other systems, tools or platforms.', 1),
((SELECT id FROM accolades WHERE code = 'D-E'), 'D-E02', 'API, SDK, and Engine Technologies', 'Offering APIs, SDKs, and engine technologies for XR development, promoting ease of use and interoperability.', 2),
((SELECT id FROM accolades WHERE code = 'D-E'), 'D-E03', 'Cloud-based Solutions and Remote Access', 'Leveraging cloud computing and remote access to enhance the functionality and reach of XR tools.', 3),
((SELECT id FROM accolades WHERE code = 'D-E'), 'D-E04', 'Networking and Multiplayer Infrastructure', 'Tools and technologies supporting networking, especially for multiplayer XR experiences.', 4);

-- E-A: Community Development and Welfare
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'E-A'), 'E-A01', 'Educational Initiatives', 'XR projects enhancing education in underprivileged areas or providing innovative learning resources.', 1),
((SELECT id FROM accolades WHERE code = 'E-A'), 'E-A02', 'Healthcare Accessibility', 'Solutions improving healthcare delivery, awareness, and accessibility in underserved communities.', 2),
((SELECT id FROM accolades WHERE code = 'E-A'), 'E-A03', 'Environmental Advocacy', 'XR applications promoting environmental conservation, sustainability, and climate change awareness.', 3),
((SELECT id FROM accolades WHERE code = 'E-A'), 'E-A04', 'Social Welfare Services', 'Projects using XR to provide or improve social services like housing, nutrition, and poverty alleviation.', 4);

-- E-B: Cultural and Historical Preservation
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'E-B'), 'E-B01', 'Heritage and Cultural Conservation', 'XR endeavours preserving cultural heritage, traditions, and historical sites.', 1),
((SELECT id FROM accolades WHERE code = 'E-B'), 'E-B02', 'Diversity and Multicultural Engagement', 'Initiatives fostering understanding and appreciation among diverse cultural groups through XR experiences.', 2),
((SELECT id FROM accolades WHERE code = 'E-B'), 'E-B03', 'Arts and Culture Promotion', 'XR projects bringing arts, music, and cultural experiences to broader audiences, enhancing engagement and accessibility.', 3),
((SELECT id FROM accolades WHERE code = 'E-B'), 'E-B04', 'Advocacy and Activism', 'XR tools that support anti-racism and antisemitism activism, including awareness campaigns and storytelling.', 4);

-- E-C: Humanitarian Aid and Crisis Management
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'E-C'), 'E-C01', 'Emergency Response and Preparedness', 'XR tools designed for disaster management, relief coordination, and crisis awareness.', 1),
((SELECT id FROM accolades WHERE code = 'E-C'), 'E-C02', 'Support for Refugees and Displaced Individuals', 'XR solutions aiding refugees with education, mental health, and integration support.', 2),
((SELECT id FROM accolades WHERE code = 'E-C'), 'E-C03', 'Human Rights and Advocacy', 'XR applications championing human rights, equality, and social justice causes.', 3),
((SELECT id FROM accolades WHERE code = 'E-C'), 'E-C04', 'War and Conflict Awareness', 'XR projects that raise awareness about the impacts of war and conflict on communities and individuals.', 4);

-- E-D: Social Awareness and Change
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'E-D'), 'E-D01', 'Health and Wellness Campaigns', 'XR campaigns focused on public health, wellness, and disease prevention.', 1),
((SELECT id FROM accolades WHERE code = 'E-D'), 'E-D02', 'Social Issue Awareness', 'Initiatives using XR to highlight and address issues like poverty, inequality, and injustice.', 2),
((SELECT id FROM accolades WHERE code = 'E-D'), 'E-D03', 'Behavior Modification and Social Campaigns', 'XR-driven projects promoting positive behaviour changes in areas like recycling, energy use, or community involvement.', 3);

-- E-E: Inclusivity and Empowerment
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'E-E'), 'E-E01', 'Accessibility Solutions', 'XR technologies enhancing access for individuals with disabilities or special needs.', 1),
((SELECT id FROM accolades WHERE code = 'E-E'), 'E-E02', 'Community Empowerment', 'XR tools empowering marginalised or vulnerable populations through technology.', 2),
((SELECT id FROM accolades WHERE code = 'E-E'), 'E-E03', 'Educational Access and Equity', 'Projects expanding educational opportunities and resources in disadvantaged areas using XR.', 3);

-- F-A: Innovation and Product Development
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'F-A'), 'F-A01', 'Innovative XR Offerings', 'Companies that have introduced novel XR products or services in the market.', 1),
((SELECT id FROM accolades WHERE code = 'F-A'), 'F-A02', 'User-Centric Design', 'Companies for developing XR solutions with a strong focus on user experience and intuitive design.', 2),
((SELECT id FROM accolades WHERE code = 'F-A'), 'F-A03', 'Emerging Technology Integration', 'Companies that effectively integrate emerging technologies into their XR solutions, such as AI or IoT.', 3);

-- F-B: Growth and Market Strategy
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'F-B'), 'F-B01', 'Market Entry and Growth Trajectory', 'Companies that have demonstrated a strong market entry and growth trajectory in the XR industry.', 1),
((SELECT id FROM accolades WHERE code = 'F-B'), 'F-B02', 'Niche Market Innovation', 'Companies that have successfully identified and served niche markets within the XR ecosystem.', 2),
((SELECT id FROM accolades WHERE code = 'F-B'), 'F-B03', 'Strategic Business Development', 'Companies for their strategic approach to business development, including partnerships, collaborations, and customer acquisition.', 3);

-- F-C: Community and Industry Engagement
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'F-C'), 'F-C01', 'Community Building and Engagement', 'Companies that actively engage with and contribute to the XR community.', 1),
((SELECT id FROM accolades WHERE code = 'F-C'), 'F-C02', 'Industry Networking and Collaboration', 'Firms for building strong industry networks and engaging in meaningful collaborations.', 2),
((SELECT id FROM accolades WHERE code = 'F-C'), 'F-C03', 'Customer and User Feedback', 'Companies that place a high emphasis on customer and user feedback to guide their product development.', 3);

-- F-D: Business Viability and Management
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'F-D'), 'F-D01', 'Effective Financial Management', 'Companies for their effective financial management strategies and potential for future profitability.', 1),
((SELECT id FROM accolades WHERE code = 'F-D'), 'F-D02', 'Scalability and Adaptability', 'Companies that have shown potential for scalability and adaptability in their business model.', 2),
((SELECT id FROM accolades WHERE code = 'F-D'), 'F-D03', 'Resourcefulness and Efficiency', 'Companies that demonstrate resourcefulness and efficiency in their operations, especially in the use of funding and resources.', 3);

-- F-E: Vision and Future Potential
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'F-E'), 'F-E01', 'Visionary Approach', 'Companies with a clear and compelling vision for their role in the XR industry.', 1),
((SELECT id FROM accolades WHERE code = 'F-E'), 'F-E02', 'Scalability Potential', 'Startups that show high potential for scaling their solutions in the XR market.', 2),
((SELECT id FROM accolades WHERE code = 'F-E'), 'F-E03', 'Responsible Innovation', 'Firms that demonstrate a commitment to responsible and ethical innovation in the XR field.', 3);

-- G-A: Industry Leadership and Influence
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-A'), 'G-A01', 'Market Leadership', 'Companies that are leaders in the XR market, setting standards and trends for the industry.', 1),
((SELECT id FROM accolades WHERE code = 'G-A'), 'G-A02', 'Innovation in XR Technology', 'Companies that consistently innovate in XR technology, products, or services.', 2),
((SELECT id FROM accolades WHERE code = 'G-A'), 'G-A03', 'Influence and Thought Leadership', 'Companies that contribute significantly to industry discourse, shaping the future of XR.', 3);

-- G-B: Business Growth and Expansion
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-B'), 'G-B01', 'Consistent Business Growth', 'Companies for sustained financial and market growth.', 1),
((SELECT id FROM accolades WHERE code = 'G-B'), 'G-B02', 'Global Market Expansion', 'Firms for successfully expanding operations or customer bases internationally.', 2),
((SELECT id FROM accolades WHERE code = 'G-B'), 'G-B03', 'Strategic Diversification', 'Companies that effectively diversify their offerings and adapt to changing market trends.', 3),
((SELECT id FROM accolades WHERE code = 'G-B'), 'G-B04', 'Strategic Partnerships and Collaborations', 'Impactful collaborations that advance the XR industry.', 4);

-- G-C: Customer Engagement and Product Excellence
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-C'), 'G-C01', 'Customer Service Excellence', 'Companies for exceptional customer support and service.', 1),
((SELECT id FROM accolades WHERE code = 'G-C'), 'G-C02', 'Superior User Experience', 'Companies that excel in delivering superior user experience and design in their XR products.', 2),
((SELECT id FROM accolades WHERE code = 'G-C'), 'G-C03', 'High Customer Loyalty', 'Companies with high levels of customer satisfaction and loyalty.', 3),
((SELECT id FROM accolades WHERE code = 'G-C'), 'G-C04', 'Quality and Reliability', 'Companies known for the quality and reliability of their XR offerings.', 4);

-- G-D: Contribution to the XR Ecosystem
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-D'), 'G-D01', 'Community Development', 'Companies that actively support and nurture the XR community.', 1),
((SELECT id FROM accolades WHERE code = 'G-D'), 'G-D02', 'Advancing Industry Standards', 'Firms contributing to the establishment and advocacy of industry standards and best practices.', 2),
((SELECT id FROM accolades WHERE code = 'G-D'), 'G-D03', 'Research and Knowledge Sharing', 'Significant investment in research and development to propel XR technology and knowledge dissemination.', 3);

-- G-E: Corporate Responsibility and Ethical Practices
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-E'), 'G-E01', 'Social and Environmental Responsibility', 'Companies for their commitment to social and environmental responsibility.', 1),
((SELECT id FROM accolades WHERE code = 'G-E'), 'G-E02', 'Ethical Business Conduct', 'Companies maintaining high ethical standards in their operations.', 2),
((SELECT id FROM accolades WHERE code = 'G-E'), 'G-E03', 'Workforce Development and Diversity', 'Companies that excel in workforce development, diversity, and inclusion.', 3);

-- G-F: Vision and Future Preparedness
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'G-F'), 'G-F01', 'Strategic Vision', 'Companies with a clear and forward-thinking strategic vision for the XR industry.', 1),
((SELECT id FROM accolades WHERE code = 'G-F'), 'G-F02', 'Anticipating Market Evolution', 'Firms adept at anticipating and adapting to future market trends and shifts.', 2),
((SELECT id FROM accolades WHERE code = 'G-F'), 'G-F03', 'Innovating for Future Markets', 'Companies pioneering new markets and applications within the XR landscape.', 3);

-- H-A: Entertainment and Gaming Centers
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'H-A'), 'H-A01', 'Commercially Resellable XR Experiences', 'Companies that develop XR experiences or games specifically designed for purchase and use by entertainment venues, such as arcades, museums, or family entertainment centres.', 1),
((SELECT id FROM accolades WHERE code = 'H-A'), 'H-A02', 'XR Gaming Arcades & Entertainment Hubs', 'Recognizing entertainment centres offering a variety of immersive XR experiences.', 2),
((SELECT id FROM accolades WHERE code = 'H-A'), 'H-A03', 'Virtual Escape Rooms and Adventures', 'Physical XR implementations in escape rooms or adventure experiences.', 3),
((SELECT id FROM accolades WHERE code = 'H-A'), 'H-A04', 'Turnkey XR Entertainment Systems', 'Developers of comprehensive XR systems designed for easy implementation and operation in various entertainment settings.', 4);

-- H-B: Cultural and Historical Experiences
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'H-B'), 'H-B01', 'Museum and Gallery Exhibitions', 'XR experiences that enhance museum and gallery visits, offering interactive and immersive historical or cultural insights.', 1),
((SELECT id FROM accolades WHERE code = 'H-B'), 'H-B02', 'Educational and Historical Installations', 'XR installations that provide educational content in a compelling, immersive manner.', 2),
((SELECT id FROM accolades WHERE code = 'H-B'), 'H-B03', 'Cultural Immersion Experiences', 'Location-based XR experiences that immerse visitors in different cultural narratives and environments.', 3),
((SELECT id FROM accolades WHERE code = 'H-B'), 'H-B04', 'Cross-Industry Collaborations', 'Collaborations between different industries to create unique XR experiences (e.g., art and technology, education and entertainment).', 4);

-- H-C: Public Spaces and Events
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'H-C'), 'H-C01', 'XR in Public Installations', 'XR experiences in public spaces such as parks, squares, or transit hubs that offer communal engagement.', 1),
((SELECT id FROM accolades WHERE code = 'H-C'), 'H-C02', 'XR at Festivals and Events', 'XR experiences designed for festivals, fairs, or public events, enhancing the event experience.', 2),
((SELECT id FROM accolades WHERE code = 'H-C'), 'H-C03', 'Pop-up XR Experiences', 'Temporary XR installations in public spaces that offer unique, time-limited immersive experiences.', 3);

-- H-D: Retail and Commercial Spaces
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'H-D'), 'H-D01', 'XR Shopping Experiences', 'Innovative use of XR in retail spaces, enhancing customer engagement and shopping experience.', 1),
((SELECT id FROM accolades WHERE code = 'H-D'), 'H-D02', 'Interactive Brand Experiences', 'Brand-centred XR experiences in commercial spaces that offer engaging, immersive interactions.', 2),
((SELECT id FROM accolades WHERE code = 'H-D'), 'H-D03', 'XR in Dining and Hospitality', 'The application of XR in dining or hospitality settings to create unique and memorable customer experiences.', 3);

-- H-E: Theme Park and Amusement Attractions
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'H-E'), 'H-E01', 'Immersive Theme Park Rides', 'Recognizing XR experiences integrated into theme park rides, enhancing the thrill and immersion.', 1),
((SELECT id FROM accolades WHERE code = 'H-E'), 'H-E02', 'Interactive Amusement Experiences', 'Honouring attractions that offer interactive, engaging XR experiences in amusement parks.', 2),
((SELECT id FROM accolades WHERE code = 'H-E'), 'H-E03', 'Themed XR Installations', 'Acknowledging uniquely themed XR installations that offer immersive storytelling and entertainment.', 3);

-- I-A: Brand Engagement and Product Promotion
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'I-A'), 'I-A01', 'Immersive Product Launches', 'XR campaigns designed to introduce new products in an immersive and engaging manner.', 1),
((SELECT id FROM accolades WHERE code = 'I-A'), 'I-A02', 'Brand Activation Experiences', 'Use of XR to elevate brand awareness and create interactive engagements.', 2),
((SELECT id FROM accolades WHERE code = 'I-A'), 'I-A03', 'Interactive Product Demonstrations', 'Implementations allowing consumers to experience products uniquely through XR.', 3),
((SELECT id FROM accolades WHERE code = 'I-A'), 'I-A04', 'Retail and In-Store XR Integrations', 'Incorporating XR into retail environments to transform the shopping experience.', 4),
((SELECT id FROM accolades WHERE code = 'I-A'), 'I-A05', 'Augmented Reality in Advertising', 'Utilising AR for creative advertising campaigns, enhancing consumer interaction with the brand.', 5);

-- I-B: Major Brand Implementations in XR
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'I-B'), 'I-B01', 'Large-Scale Experiential Campaigns', 'XR experiences that transform spaces for brand promotion, such as building projections or interactive installations.', 1),
((SELECT id FROM accolades WHERE code = 'I-B'), 'I-B02', 'Virtual World Brand Integrations', 'Integrating brand presence into virtual worlds and gaming platforms using XR technologies.', 2),
((SELECT id FROM accolades WHERE code = 'I-B'), 'I-B03', 'Landmark Augmentation', 'Transforming landmarks or public spaces into immersive brand experiences through XR.', 3),
((SELECT id FROM accolades WHERE code = 'I-B'), 'I-B04', 'Immersive Storytelling in Branding', 'Using XR to tell compelling brand stories, creating deep audience connections.', 4);

-- I-C: Event and Experience Marketing
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'I-C'), 'I-C01', 'XR-Enhanced Live Events', 'Leveraging XR to augment live events, offering immersive and interactive experiences.', 1),
((SELECT id FROM accolades WHERE code = 'I-C'), 'I-C02', 'Virtual and Hybrid Event Experiences', 'Utilising XR for engaging virtual or hybrid brand events.', 2),
((SELECT id FROM accolades WHERE code = 'I-C'), 'I-C03', 'Location-Based Experiential Marketing', 'Creating immersive XR experiences in specific locations for brand promotion.', 3),
((SELECT id FROM accolades WHERE code = 'I-C'), 'I-C04', 'Experiential Marketing Installations', 'Designing immersive installations or experiences for audience engagement at events or public spaces.', 4);

-- I-D: Immersive Advertising and Content
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'I-D'), 'I-D01', 'Immersive Ad Campaigns', 'XR advertising campaigns that create deeply immersive and engaging experiences for consumers.', 1),
((SELECT id FROM accolades WHERE code = 'I-D'), 'I-D02', 'Augmented Reality in Advertising', 'Use of AR technology in campaigns to enhance consumer interaction with brands.', 2),
((SELECT id FROM accolades WHERE code = 'I-D'), 'I-D03', 'Influencer Based Marketing', 'Interaction with XR and tech content creators across various social platforms to create a compelling immersive marketing campaign.', 3);

-- J-A: Narrative and Storytelling
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'J-A'), 'J-A01', 'Narrative XR Films', 'Films that utilise XR technologies to tell compelling, immersive stories.', 1),
((SELECT id FROM accolades WHERE code = 'J-A'), 'J-A02', 'Interactive Storytelling', 'Experiences that combine XR with interactive elements, allowing users to engage with the narrative actively.', 2),
((SELECT id FROM accolades WHERE code = 'J-A'), 'J-A03', '360-Degree Video Content', 'Films and documentaries leveraging 360-degree video technology for immersive storytelling.', 3),
((SELECT id FROM accolades WHERE code = 'J-A'), 'J-A04', 'Festival and Tour Features', 'Content specifically created for film festivals, tours, or special events, offering unique storytelling perspectives.', 4);

-- J-B: Experimental and Artistic Content
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'J-B'), 'J-B01', 'Artistic XR Installations', 'Immersive XR experiences that push artistic boundaries and offer novel visual and sensory experiences.', 1),
((SELECT id FROM accolades WHERE code = 'J-B'), 'J-B02', 'Experimental Story Formats', 'Projects that explore new storytelling formats and narrative structures using XR technologies.', 2),
((SELECT id FROM accolades WHERE code = 'J-B'), 'J-B03', 'Cross-Media Experiences', 'Content that blends XR with other media forms, such as traditional film, theatre, or visual arts.', 3),
((SELECT id FROM accolades WHERE code = 'J-B'), 'J-B04', 'Location-Based Sensory Experiences', 'XR experiences designed for specific locations or settings, offering rich, multisensory engagement.', 4);

-- J-C: Immersive Environments and Virtual Worlds
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'J-C'), 'J-C01', 'Virtual Worlds and Environments', 'Comprehensive and detailed virtual environments for exploration.', 1),
((SELECT id FROM accolades WHERE code = 'J-C'), 'J-C02', 'Historical and Cultural Reconstructions', 'XR recreations of historical or cultural environments.', 2),
((SELECT id FROM accolades WHERE code = 'J-C'), 'J-C03', 'Nature and Wildlife Explorations', 'XR experiences that transport users to natural settings or wildlife encounters.', 3);

-- J-D: Social, Cultural, and Personal Narratives
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'J-D'), 'J-D01', 'Social and Global Issues', 'XR content that explores and raises awareness on important social and global issues.', 1),
((SELECT id FROM accolades WHERE code = 'J-D'), 'J-D02', 'Cultural Narratives and Stories', 'Showcasing diverse cultural stories and experiences through XR.', 2),
((SELECT id FROM accolades WHERE code = 'J-D'), 'J-D03', 'Biographical and Personal Stories', 'XR projects that focus on individual life stories, offering personal and biographical insights.', 3),
((SELECT id FROM accolades WHERE code = 'J-D'), 'J-D04', 'Documentary and Educational Content', 'XR films and experiences focused on documentary-style storytelling or educational themes.', 4);

-- K-A: Input and Interaction Devices
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-A'), 'K-A01', 'Motion Controllers', 'Devices that provide intuitive and responsive control within XR environments.', 1),
((SELECT id FROM accolades WHERE code = 'K-A'), 'K-A02', 'Haptic Feedback Devices', 'Peripherals offering tactile feedback to increase immersion and sensory experience in XR.', 2),
((SELECT id FROM accolades WHERE code = 'K-A'), 'K-A03', 'Tracking and Gesture Control', 'Hardware that enables precise hand and eye tracking and gesture recognition for natural interaction.', 3);

-- K-B: Wearable and Immersive Accessories
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-B'), 'K-B01', 'Wearable Suits and Gloves', 'Technology enhancing body tracking and immersion, such as haptic suits and gloves.', 1),
((SELECT id FROM accolades WHERE code = 'K-B'), 'K-B02', 'Specialized Footwear', 'Footwear peripherals designed to enrich movement and interaction in XR spaces.', 2),
((SELECT id FROM accolades WHERE code = 'K-B'), 'K-B03', 'Sensory Enhancement Accessories', 'Devices that enhance other sensory perceptions, like smell, temperature or wind simulation.', 3);

-- K-C: Environmental and Spatial Enhancements
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-C'), 'K-C01', 'Room-Scale Tracking Systems', 'Hardware expanding and enhancing room-scale tracking capabilities for XR.', 1),
((SELECT id FROM accolades WHERE code = 'K-C'), 'K-C02', 'Portable and Compact Peripherals', 'Devices designed for portability, facilitating XR experiences in various environments.', 2),
((SELECT id FROM accolades WHERE code = 'K-C'), 'K-C03', 'Environmental Simulation Hardware', 'Peripherals simulating environmental elements to heighten the realism in XR experiences.', 3);

-- K-D: Display and Projection Enhancements
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-D'), 'K-D01', 'Advanced Projection Systems', 'Hardware using projection technology to augment physical spaces with XR content.', 1),
((SELECT id FROM accolades WHERE code = 'K-D'), 'K-D02', 'Holographic and Mixed Reality Systems', 'Devices that create holographic or mixed reality experiences in physical spaces.', 2),
((SELECT id FROM accolades WHERE code = 'K-D'), 'K-D03', 'Mixed Reality Capture and Integration', 'Hardware that captures and integrates real-world elements into XR environments.', 3);

-- K-E: Audio and Communication Devices
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-E'), 'K-E01', 'Immersive Audio Systems', 'Peripherals providing 3D or spatial audio for enhanced auditory experiences in XR.', 1),
((SELECT id FROM accolades WHERE code = 'K-E'), 'K-E02', 'Communication and Networking Devices', 'Hardware enabling effective communication and networking within XR environments.', 2),
((SELECT id FROM accolades WHERE code = 'K-E'), 'K-E03', 'Audio Capture and Sound Isolation', 'Devices focused on improving the audio experience by capturing spatial audio or cancelling external noise.', 3);

-- K-F: Utility Accessories and Enhancements
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'K-F'), 'K-F01', 'Utility and Support Accessories', 'Including peripherals that enhance the functionality or usability of XR systems, such as stands, cases, or adapters.', 1),
((SELECT id FROM accolades WHERE code = 'K-F'), 'K-F02', 'Power Solutions and Extensions', 'Covering battery packs, charging solutions, and other power-related accessories that extend the usage time and flexibility of XR hardware.', 2),
((SELECT id FROM accolades WHERE code = 'K-F'), 'K-F03', 'Health and Wellness Monitors', 'Featuring peripherals focused on monitoring user health and wellness during XR sessions, ensuring a safer experience.', 3),
((SELECT id FROM accolades WHERE code = 'K-F'), 'K-F04', 'Ergonomic Enhancements', 'Emphasising accessories designed to improve the ergonomics of XR hardware, enhancing comfort and reducing strain during extended use.', 4);

-- L-A: Virtual Reality (VR) Headsets
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'L-A'), 'L-A01', 'Standalone VR Headsets', 'Self-contained VR headsets that operate without the need for external hardware.', 1),
((SELECT id FROM accolades WHERE code = 'L-A'), 'L-A02', 'PC-Powered VR Headsets', 'VR headsets that connect to a PC to deliver high-quality, immersive experiences.', 2),
((SELECT id FROM accolades WHERE code = 'L-A'), 'L-A03', 'Console-Compatible VR Headsets', 'VR headsets designed to work with gaming consoles, enhancing the gaming experience.', 3);

-- L-B: Augmented Reality (AR) Headsets
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'L-B'), 'L-B01', 'Wearable AR Glasses', 'Recognizing lightweight and wearable AR glasses designed for everyday use, providing convenient access to digital information overlaid on the physical world.', 1),
((SELECT id FROM accolades WHERE code = 'L-B'), 'L-B02', 'Heads-Up Display AR Headsets', 'Acknowledging AR headsets that offer heads-up display capabilities, similar to traditional eyewear, for seamless information integration into the user''s field of view.', 2),
((SELECT id FROM accolades WHERE code = 'L-B'), 'L-B03', 'Industrial and Professional AR Headsets', 'Celebrating AR headsets tailored for industrial or professional environments, focusing on durability, utility, and enhanced functionality.', 3);

-- L-C: Mixed Reality (MR) Headsets
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'L-C'), 'L-C01', 'Standalone MR Headsets', 'Recognizing self-contained MR headsets that operate independently, offering both VR and AR experiences through passthrough technology.', 1),
((SELECT id FROM accolades WHERE code = 'L-C'), 'L-C02', 'PC-Powered MR Headsets', 'Acknowledging MR headsets that connect to a PC, providing high-quality mixed reality experiences by combining elements of both VR and AR.', 2),
((SELECT id FROM accolades WHERE code = 'L-C'), 'L-C03', 'Console-Compatible MR Headsets', 'Celebrating MR headsets designed to work with gaming consoles, enhancing the gaming experience by blending virtual and augmented realities.', 3);

-- M-A: Platform-Specific Games
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'M-A'), 'M-A01', 'Virtual Reality (VR) Games', 'Including fully immersive VR titles designed for VR platforms.', 1),
((SELECT id FROM accolades WHERE code = 'M-A'), 'M-A02', 'Augmented Reality (AR) Games', 'Games that integrate AR technology, designed for mobile or wearable devices.', 2),
((SELECT id FROM accolades WHERE code = 'M-A'), 'M-A03', 'Mixed Reality (MR) Games', 'Titles that blend physical and digital elements, offering MR experiences.', 3);

-- M-B: Gameplay and Experience Diversity
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'M-B'), 'M-B01', 'Multiplayer and Social Interaction Games', 'Titles focused on multiplayer gameplay or social interaction in XR.', 1),
((SELECT id FROM accolades WHERE code = 'M-B'), 'M-B02', 'Story-Driven and Narrative Experiences', 'Games with a strong emphasis on narrative, storytelling, and character development.', 2),
((SELECT id FROM accolades WHERE code = 'M-B'), 'M-B03', 'Educational, Training, and Serious Games', 'XR games designed for educational purposes, skills training, or addressing serious themes.', 3);

-- M-C: Game Scale and Development Type
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'M-C'), 'M-C01', 'Indie Games', 'Recognizing independently developed XR games, noted for their creativity and innovation.', 1),
((SELECT id FROM accolades WHERE code = 'M-C'), 'M-C02', 'AAA Games', 'High-budget, large-scale XR games produced by major game development studios.', 2),
((SELECT id FROM accolades WHERE code = 'M-C'), 'M-C03', 'Experimental and Artistic Games', 'Games that focus on experimental gameplay, artistic expression, or unconventional XR experiences.', 3);

-- M-D: Special Categories
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'M-D'), 'M-D01', 'Quest Lab and Early Access Games', 'Titles in early development stages, but released to the public on places like Quest Lab or similar platforms.', 1),
((SELECT id FROM accolades WHERE code = 'M-D'), 'M-D02', 'Adaptations', 'XR games that are adaptations of existing non-XR titles or spin-offs from other media, creatively translated into the XR format.', 2),
((SELECT id FROM accolades WHERE code = 'M-D'), 'M-D03', 'Cross-Platform Compatibility', 'Games designed for compatibility across multiple XR platforms, allowing players from various systems to interact and play together.', 3);

-- N-A: Platform-Specific Content Creators
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'N-A'), 'N-A01', 'YouTube Creators', 'Recognizing individuals or groups who create outstanding XR-related content on YouTube, such as tutorials, reviews, or storytelling.', 1),
((SELECT id FROM accolades WHERE code = 'N-A'), 'N-A02', 'Instagram Creators', 'Celebrating creators who use Instagram to share innovative XR experiences, insights, and creative content.', 2),
((SELECT id FROM accolades WHERE code = 'N-A'), 'N-A03', 'TikTok and Short-Form Content', 'Acknowledging creators excelling in short-form XR content on platforms like TikTok.', 3),
((SELECT id FROM accolades WHERE code = 'N-A'), 'N-A04', 'Twitch and Live Streaming Content', 'Acknowledging streamers who excel in live XR content on platforms like Twitch, engaging audiences with real-time experiences.', 4),
((SELECT id FROM accolades WHERE code = 'N-A'), 'N-A05', 'Podcast Creators', 'Podcasters on platforms like Spotify who discuss XR topics, trends, and innovations.', 5);

-- N-B: Content Focus and Style
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'N-B'), 'N-B01', 'Educational and Informative Content', 'Recognizing creators who focus on educating their audience about XR technology, trends, and applications.', 1),
((SELECT id FROM accolades WHERE code = 'N-B'), 'N-B02', 'Entertainment and Interactive Content', 'Celebrating creators producing entertaining and interactive XR content that engages and captivates audiences.', 2),
((SELECT id FROM accolades WHERE code = 'N-B'), 'N-B03', 'Creative and Artistic XR Content', 'Acknowledging creators who use XR as a medium for artistic expression and creative storytelling.', 3);

-- N-C: Community Engagement and Growth
INSERT INTO accolades (parent_id, code, name, description, sort_order) VALUES
((SELECT id FROM accolades WHERE code = 'N-C'), 'N-C01', 'Community Building Creators', 'Recognizing creators who actively engage with and grow the XR community through their content and interactions.', 1),
((SELECT id FROM accolades WHERE code = 'N-C'), 'N-C02', 'Emerging Voices in XR', 'Celebrating up-and-coming influencers who have shown significant potential and growth in the XR content space.', 2),
((SELECT id FROM accolades WHERE code = 'N-C'), 'N-C03', 'Influencers with Broad Impact', 'Celebrating creators whose XR content has a broad and significant impact, reaching a wide audience.', 3),
((SELECT id FROM accolades WHERE code = 'N-C'), 'N-C04', 'Collaborative and Cross-Platform Creators', 'Acknowledging creators who excel in collaborative efforts and cross-platform content creation in XR.', 4);

-- =============================================
-- LINK CATEGORIES TO ACCOLADE TYPES (Level 1)
-- =============================================

-- A - XR Healthcare Solution (497de2de-ef5b-4d56-a05b-1f023e86cf90)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '497de2de-ef5b-4d56-a05b-1f023e86cf90'::uuid, id FROM accolades WHERE code IN ('A-A', 'A-B', 'A-C', 'A-D', 'A-E');

-- B - XR Education & Training (a5c6cd74-e0f4-4cd8-95b8-a22f8b9ab7dd)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'a5c6cd74-e0f4-4cd8-95b8-a22f8b9ab7dd'::uuid, id FROM accolades WHERE code IN ('B-A', 'B-B', 'B-C', 'B-D', 'B-E');

-- C - XR Enterprise Solution (f408b9c0-2a6e-4c54-9050-d2097a5e295e)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'f408b9c0-2a6e-4c54-9050-d2097a5e295e'::uuid, id FROM accolades WHERE code IN ('C-A', 'C-B', 'C-C', 'C-D', 'C-E');

-- D - XR Tool & Utility (d0b5690c-be57-4455-9454-5cdda4b52a97)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'd0b5690c-be57-4455-9454-5cdda4b52a97'::uuid, id FROM accolades WHERE code IN ('D-A', 'D-B', 'D-C', 'D-D', 'D-E');

-- E - AIXR Social Impact Award (ef2ee323-c1b5-44af-9f11-014a03bb1f08)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'ef2ee323-c1b5-44af-9f11-014a03bb1f08'::uuid, id FROM accolades WHERE code IN ('E-A', 'E-B', 'E-C', 'E-D', 'E-E');

-- F - Rising XR Company (5daae4cd-5ea0-4257-b145-e8e131b7bc04)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '5daae4cd-5ea0-4257-b145-e8e131b7bc04'::uuid, id FROM accolades WHERE code IN ('F-A', 'F-B', 'F-C', 'F-D', 'F-E');

-- G - Outstanding XR Company / Obsidian Award (b861796e-1fbb-4822-a9d0-240c2d040cfd)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'b861796e-1fbb-4822-a9d0-240c2d040cfd'::uuid, id FROM accolades WHERE code IN ('G-A', 'G-B', 'G-C', 'G-D', 'G-E', 'G-F');

-- H - XR Location-Based Experience (5145d161-b0ef-423c-817f-339abadad9ff)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '5145d161-b0ef-423c-817f-339abadad9ff'::uuid, id FROM accolades WHERE code IN ('H-A', 'H-B', 'H-C', 'H-D', 'H-E');

-- I - XR Marketing Campaign (77bc8b6e-52b6-45e7-9a59-7f5e7b7b59de)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '77bc8b6e-52b6-45e7-9a59-7f5e7b7b59de'::uuid, id FROM accolades WHERE code IN ('I-A', 'I-B', 'I-C', 'I-D');

-- J - XR Film & Experience (42279740-fd90-47b0-b33a-2c2e34dd89e3)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '42279740-fd90-47b0-b33a-2c2e34dd89e3'::uuid, id FROM accolades WHERE code IN ('J-A', 'J-B', 'J-C', 'J-D');

-- K - XR Peripheral Hardware (d440b98c-5cea-42a4-83f8-0b710c818b78)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'd440b98c-5cea-42a4-83f8-0b710c818b78'::uuid, id FROM accolades WHERE code IN ('K-A', 'K-B', 'K-C', 'K-D', 'K-E', 'K-F');

-- L - XR HMD (4b2ca367-e456-49d7-8848-15269d4046a1)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '4b2ca367-e456-49d7-8848-15269d4046a1'::uuid, id FROM accolades WHERE code IN ('L-A', 'L-B', 'L-C');

-- M - XR Game (a44e9a9e-41e7-4697-831d-a051240ed848)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT 'a44e9a9e-41e7-4697-831d-a051240ed848'::uuid, id FROM accolades WHERE code IN ('M-A', 'M-B', 'M-C', 'M-D');

-- N - XR Content Creator (18927502-19ac-4774-91d0-e16352f90896)
INSERT INTO category_accolades (category_id, accolade_id)
SELECT '18927502-19ac-4774-91d0-e16352f90896'::uuid, id FROM accolades WHERE code IN ('N-A', 'N-B', 'N-C');

