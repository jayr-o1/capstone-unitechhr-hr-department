const jobDetailsData = [
    {
        id: 1,
        title: "Computer Science Instructor",
        summary: "Responsible for teaching programming, algorithms, and data structures.",
        department: "College of Computer Studies",
        keyDuties: [
            "Teach programming",
            "Prepare lesson plans",
            "Conduct assessments",
            "Grade students"
        ],
        essentialSkills: [
            "Python, Java, or C++",
            "Strong understanding of algorithms",
            "Strong understanding of database systems"
        ],
        qualifications: ["Bachelor’s in CS", "Teaching experience preferred", "Programming experience preferred"],
        salary: "Up to 20k",
        workSetup: "On Site",
        datePosted: "1 day ago",
        availableSlots: 1,
        newApplicants: true,
        status: "Open",
        applicants: [
            {
                name: "John Doe",
                email: "john.doe@example.com",
                dateApplied: "2023-10-01",
                resumeUrl: "https://example.com/resume/john-doe",
                status: "Pending", // Added status
            },
            {
                name: "Jane Smith",
                email: "jane.smith@example.com",
                dateApplied: "2023-10-02",
                resumeUrl: "https://example.com/resume/jane-smith",
                status: "Approved", // Added status
            },
        ],
    },
    {
        id: 2,
        title: "Business Accountancy Instructor",
        summary: "Managing financial records and accounting principles.",
        department: "College of Business Accountancy",
        keyDuties: ["Teach accounting principles", "Analyze financial records"],
        essentialSkills: ["Financial management", "Tax regulations knowledge"],
        qualifications: ["Bachelor’s in Accounting", "CPA license preferred"],
        salary: "Up to 20k",
        workSetup: "On Site",
        datePosted: "1 day ago",
        availableSlots: 2,
        newApplicants: false,
        status: "Open",
        applicants: [
            {
                name: "Alice Johnson",
                email: "alice.johnson@example.com",
                dateApplied: "2023-10-03",
                resumeUrl: "https://example.com/resume/alice-johnson",
                status: "Rejected", // Added status
            },
        ],
    },
    {
        id: 3,
        title: "Criminology Instructor",
        summary: "Teaches forensic science and law enforcement principles.",
        department: "College of Criminology",
        keyDuties: [
            "Teach criminology concepts",
            "Prepare forensic case studies",
        ],
        essentialSkills: [
            "Knowledge of forensic science",
            "Understanding of criminal law",
        ],
        qualifications: [
            "Bachelor’s in Criminology",
            "Law enforcement experience",
        ],
        salary: "Up to 20k",
        workSetup: "On Site",
        datePosted: "1 day ago",
        availableSlots: 1,
        newApplicants: false,
        status: "Closed",
        applicants: [], // No applicants for this job
    },
    {
        id: 4,
        title: "Information Technology Instructor",
        summary: "Teaches IT infrastructure, networking, and cybersecurity concepts.",
        department: "College of Computer Studies",
        keyDuties: [
            "Teach networking and IT security",
            "Guide students in hands-on labs",
            "Stay updated on cybersecurity trends",
        ],
        essentialSkills: ["Network security", "System administration"],
        qualifications: [
            "Bachelor’s in IT or related field",
            "Industry certifications preferred",
        ],
        salary: "Up to 22k",
        workSetup: "On Site",
        datePosted: "2 days ago",
        availableSlots: 1,
        newApplicants: false,
        status: "Open",
        applicants: [
            {
                name: "Bob Brown",
                email: "bob.brown@example.com",
                dateApplied: "2023-10-04",
                resumeUrl: "https://example.com/resume/bob-brown",
                status: "Pending", // Added status
            },
        ],
    },
    {
        id: 5,
        title: "Marketing Specialist",
        summary: "Responsible for developing and executing marketing campaigns.",
        department: "Marketing Department",
        keyDuties: [
            "Develop marketing strategies",
            "Manage social media content",
            "Analyze campaign performance",
        ],
        essentialSkills: ["SEO", "Content marketing", "Graphic design"],
        qualifications: ["Bachelor’s in Marketing or related field"],
        salary: "Up to 18k",
        workSetup: "Hybrid",
        datePosted: "3 days ago",
        availableSlots: 1,
        newApplicants: true,
        status: "Open",
        applicants: [
            {
                name: "Charlie Davis",
                email: "charlie.davis@example.com",
                dateApplied: "2023-10-05",
                resumeUrl: "https://example.com/resume/charlie-davis",
                status: "Approved", // Added status
            },
        ],
    },
    {
        id: 6,
        title: "Human Resources Assistant",
        summary: "Supports HR processes including recruitment and employee relations.",
        department: "Human Resources",
        keyDuties: [
            "Assist in hiring process",
            "Maintain employee records",
            "Coordinate training sessions",
        ],
        essentialSkills: ["HRIS", "Recruitment", "Communication"],
        qualifications: ["Bachelor’s in HR or Business Administration"],
        salary: "Up to 17k",
        workSetup: "On Site",
        datePosted: "3 days ago",
        availableSlots: 1,
        newApplicants: false,
        status: "Closed",
        applicants: [], // No applicants for this job
    },
    {
        id: 7,
        title: "Data Analyst",
        summary: "Analyzes data trends to support business decisions.",
        department: "Analytics Department",
        keyDuties: [
            "Interpret data patterns",
            "Create reports and dashboards",
            "Assist in business forecasting",
        ],
        essentialSkills: ["SQL", "Python", "Data visualization tools"],
        qualifications: ["Bachelor’s in Data Science or related field"],
        salary: "Up to 25k",
        workSetup: "Remote",
        datePosted: "4 days ago",
        availableSlots: 1,
        newApplicants: true,
        status: "Open",
        applicants: [
            {
                name: "Eve Wilson",
                email: "eve.wilson@example.com",
                dateApplied: "2023-10-06",
                resumeUrl: "https://example.com/resume/eve-wilson",
                status: "Pending", // Added status
            },
        ],
    },
    {
        id: 8,
        title: "Administrative Assistant",
        summary: "Handles clerical tasks and office coordination.",
        department: "Administration",
        keyDuties: [
            "Organize documents",
            "Schedule meetings",
            "Respond to emails and calls",
        ],
        essentialSkills: [
            "Microsoft Office",
            "Organization",
            "Time management",
        ],
        qualifications: [
            "Associate’s or Bachelor’s in Business Administration",
        ],
        salary: "Up to 15k",
        workSetup: "On Site",
        datePosted: "5 days ago",
        availableSlots: 1,
        newApplicants: false,
        status: "Closed",
        applicants: [], // No applicants for this job
    },
    {
        id: 9,
        title: "Graphic Designer",
        summary: "Designs marketing materials and digital content.",
        department: "Creative Team",
        keyDuties: [
            "Create digital and print designs",
            "Develop branding materials",
            "Collaborate with marketing team",
        ],
        essentialSkills: ["Adobe Photoshop", "Illustrator", "Creativity"],
        qualifications: ["Bachelor’s in Graphic Design or equivalent"],
        salary: "Up to 20k",
        workSetup: "Hybrid",
        datePosted: "5 days ago",
        availableSlots: 1,
        newApplicants: true,
        status: "Open",
        applicants: [
            {
                name: "Frank Moore",
                email: "frank.moore@example.com",
                dateApplied: "2023-10-07",
                resumeUrl: "https://example.com/resume/frank-moore",
                status: "Rejected", // Added status
            },
        ],
    },
    {
        id: 10,
        title: "Customer Support Representative",
        summary: "Provides assistance to customers regarding company services.",
        department: "Customer Service",
        keyDuties: [
            "Handle customer inquiries",
            "Resolve issues promptly",
            "Maintain customer satisfaction",
        ],
        essentialSkills: ["Communication", "Problem-solving", "Empathy"],
        qualifications: ["High school diploma or equivalent"],
        salary: "Up to 18k",
        workSetup: "Remote",
        datePosted: "6 days ago",
        availableSlots: 3,
        newApplicants: false,
        status: "Closed",
        applicants: [], // No applicants for this job
    },
];

export default jobDetailsData;