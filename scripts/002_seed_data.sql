-- Seed Experts
INSERT INTO public.experts (name, specialization, experience, rating, availability, initials, bio) VALUES
('Dr. Priya Sharma', 'Anxiety & Stress Management', '10+ years', 4.9, 'Available Today', 'PS', 'Specialized in helping students cope with academic pressure and anxiety disorders.'),
('Dr. Rahul Mehta', 'Depression & Mood Disorders', '8 years', 4.8, 'Available Tomorrow', 'RM', 'Expert in cognitive behavioral therapy for mood disorders.'),
('Dr. Ananya Patel', 'Student Counseling', '6 years', 4.7, 'Available Today', 'AP', 'Dedicated to supporting students through their academic journey.'),
('Dr. Vikram Singh', 'Trauma & PTSD', '12 years', 4.9, 'Next Week', 'VS', 'Specialized in trauma-informed care and EMDR therapy.'),
('Dr. Sneha Gupta', 'Relationship Counseling', '7 years', 4.6, 'Available Today', 'SG', 'Helping individuals navigate personal and social relationships.'),
('Dr. Arjun Nair', 'Career & Academic Stress', '5 years', 4.8, 'Available Tomorrow', 'AN', 'Focused on career guidance and academic stress management.');

-- Seed Peer Listeners
INSERT INTO public.peer_listeners (name, specialization, sessions_completed, rating, availability, initials, is_good_listener, bio) VALUES
('Aisha Rahman', 'Anxiety Support', 156, 4.9, 'Available Now', 'AR', true, 'Fellow student who understands exam stress and anxiety.'),
('Rohan Kapoor', 'Academic Stress', 203, 4.8, 'Available Now', 'RK', true, 'Senior student helping juniors with academic challenges.'),
('Meera Joshi', 'Relationship Issues', 178, 4.7, 'Available Today', 'MJ', true, 'Trained peer counselor for personal matters.'),
('Karan Malhotra', 'Career Guidance', 145, 4.9, 'Available Now', 'KM', true, 'Graduate student offering career advice.'),
('Priya Desai', 'Self-Esteem', 189, 4.8, 'Available Today', 'PD', true, 'Psychology student passionate about helping others.'),
('Aryan Shah', 'General Support', 234, 4.9, 'Available Now', 'AS', true, 'Experienced listener for any topic you need to discuss.');
