import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coffee,
  FileCheck2,
  Globe2,
  GraduationCap,
  Handshake,
  MessageCircle,
  Megaphone,
  PackageSearch,
  Play,
  ShieldCheck,
  ShoppingCart,
  Ship,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { isExcludedFunnelCourse } from "@/lib/courseFunnels";
import { minutesToDurationLabel } from "@/lib/format";
import type { ApiResponse, Course } from "@/lib/types";
import backgroundImage from "@/assets/background.jpg";
import tesbinnLogo from "@/assets/TESBINN-logo.jpg";

type TrainingLandingConfig = {
  slug: string;
  label: string;
  eyebrow: string;
  icon: typeof Ship;
  heroImage: string;
  headline: string;
  subheadline: string;
  urgency: string;
  painTitle: string;
  painPoints: string[];
  truth: string;
  solutionTitle: string;
  solutionIntro: string;
  solutionPoints: string[];
  skillsTitle: string;
  skills: string[];
  experienceTitle: string;
  experiencePoints: string[];
  opportunityTitle: string;
  opportunities: string[];
  priceTitle: string;
  priceLine: string;
  includes: string[];
  testimonials: string[];
  finalTitle: string;
  finalSubtitle: string;
  seatsLeft: number;
};

type CoursePromotionProfile = Pick<
  TrainingLandingConfig,
  | "eyebrow"
  | "icon"
  | "headline"
  | "painTitle"
  | "painPoints"
  | "truth"
  | "solutionTitle"
  | "solutionIntro"
  | "solutionPoints"
  | "skillsTitle"
  | "skills"
  | "opportunityTitle"
  | "opportunities"
  | "testimonials"
  | "finalTitle"
  | "finalSubtitle"
>;

const whatsappUrl =
  "https://wa.me/251929243367?text=Hello%20TESBINN%2C%20I%20want%20to%20register%20for%20training.";

const sharedIncludes = [
  "Full training access",
  "Practical sessions",
  "Certification",
  "Business guidance",
];

const trainings: Record<string, TrainingLandingConfig> = {
  "import-export-training": {
    slug: "import-export-training",
    label: "Import Export Training",
    eyebrow: "International Trade Training",
    icon: Ship,
    heroImage:
      "https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?auto=format&fit=crop&w=1400&q=80",
    headline: "Stop Struggling Locally. Start Trading Globally.",
    subheadline:
      "Learn how to import from China and export Ethiopian products step by step, even if you are starting from zero.",
    urgency: "Next batch is filling fast. Limited seats only.",
    painTitle: "Why Most People Stay Stuck",
    painPoints: [
      "One income source is not enough",
      "Salary growth is slow",
      "Global market access feels confusing",
      "Import, export, logistics, and documents feel risky",
      "Fear of losing money blocks action",
    ],
    truth:
      "The opportunity is real, but the knowledge gap is costing people money every day.",
    solutionTitle: "This Training Shows You How to Enter International Trade",
    solutionIntro: "TESBINN focuses on practical trade execution, not classroom theory.",
    solutionPoints: [
      "Import products from China, Dubai, and Turkey",
      "Export Ethiopian coffee, spices, and other products",
      "Find buyers, suppliers, and profitable products",
      "Calculate profit before committing money",
      "Handle logistics, payments, and documents with confidence",
    ],
    skillsTitle: "Practical Skills You Will Gain",
    skills: [
      "Supplier sourcing on Alibaba and direct factory channels",
      "Product selection with high profit margins",
      "Price negotiation strategies",
      "Shipping, customs, and logistics basics",
      "Safe payment methods",
      "Export documentation and global selling",
    ],
    experienceTitle: "Real Business Training",
    experiencePoints: [
      "Live demonstrations",
      "Real case studies",
      "Step-by-step import and export process",
      "Market insights from practitioners",
    ],
    opportunityTitle: "How This Skill Can Create Income",
    opportunities: [
      "Import products and sell locally",
      "Export Ethiopian products to global buyers",
      "Build long-term business income",
      "Recover your training fee from one smart deal",
    ],
    priceTitle: "Small Investment. Life-Changing Skill.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I started importing products after this training.",
      "Now I understand global trade clearly.",
      "This changed my financial direction.",
    ],
    finalTitle: "This Is Your Moment. Take Action Now.",
    finalSubtitle: "Secure your seat before this batch closes.",
    seatsLeft: 7,
  },
  "barista-training": {
    slug: "barista-training",
    label: "Barista Training",
    eyebrow: "Coffee Career Training",
    icon: Coffee,
    heroImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80",
    headline: "Turn Your Passion for Coffee Into a High-Income Skill.",
    subheadline:
      "Learn professional barista skills, master espresso and latte art, and start your career or coffee business with confidence.",
    urgency: "Limited seats. Next batch starting soon.",
    painTitle: "Imagine This",
    painPoints: [
      "Working in a modern coffee shop",
      "Creating beautiful latte art",
      "Earning income from a skill you enjoy",
      "Starting your own coffee business",
      "Joining Ethiopia's world-famous coffee industry",
    ],
    truth: "This is not just a dream. It is a skill you can learn.",
    solutionTitle: "Coffee Is One of the World's Biggest Industries",
    solutionIntro:
      "Ethiopia is the origin of coffee, and skilled baristas are in demand locally and internationally.",
    solutionPoints: [
      "Coffee shops are expanding rapidly",
      "Global demand keeps growing",
      "Practical skill creates job and business options",
      "Good service and preparation increase customer loyalty",
    ],
    skillsTitle: "Master Professional Barista Skills",
    skills: [
      "Espresso preparation and perfect extraction",
      "Milk steaming and texture control",
      "Latte art: heart, rosetta, and tulip",
      "Coffee machine handling",
      "Coffee bean knowledge",
      "Customer service and coffee shop operations",
    ],
    experienceTitle: "100% Practical. Learn By Doing.",
    experiencePoints: [
      "Hands-on training with real machines",
      "Live demonstrations",
      "Practice sessions",
      "Real cafe-style environment",
    ],
    opportunityTitle: "Where This Skill Can Take You",
    opportunities: [
      "Work in coffee shops locally or internationally",
      "Work abroad as a barista",
      "Start your own coffee business",
      "Build long-term income from one practical skill",
    ],
    priceTitle: "Affordable Investment. High-Return Skill.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: [
      "Full practical training",
      "Coffee materials and sessions",
      "Certification",
      "Business insights",
    ],
    testimonials: [
      "I got a job after completing the training.",
      "I can now confidently operate coffee machines.",
      "The training is practical and enjoyable.",
    ],
    finalTitle: "Start Your Coffee Journey Today.",
    finalSubtitle: "Register now and build a skill people can see, taste, and pay for.",
    seatsLeft: 9,
  },
  "coffee-cupping-training": {
    slug: "coffee-cupping-training",
    label: "Coffee Cupping Training",
    eyebrow: "Premium Coffee Skill",
    icon: Award,
    heroImage:
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=80",
    headline: "Master Coffee Tasting. Become a Coffee Quality Expert.",
    subheadline:
      "Learn professional coffee cupping, sensory analysis, and quality grading for high-value opportunities in the coffee industry.",
    urgency: "Limited seats. Next professional batch starting soon.",
    painTitle: "Ethiopia Produces Coffee. Experts Capture the Value.",
    painPoints: [
      "Buyers pay premium prices for quality",
      "Only trained professionals can evaluate and grade coffee",
      "Skilled cuppers are in demand locally and internationally",
      "Quality knowledge helps exporters and coffee businesses earn more",
    ],
    truth: "If you understand quality, you control value.",
    solutionTitle: "More Than Tasting. It Is a Professional Skill.",
    solutionIntro:
      "Coffee cupping is the method exporters, buyers, and professionals use to evaluate coffee.",
    solutionPoints: [
      "Evaluate coffee quality",
      "Identify flavor profiles",
      "Grade coffee for export markets",
      "Understand how quality affects pricing",
    ],
    skillsTitle: "Professional Skills You Will Gain",
    skills: [
      "Sensory analysis: aroma, acidity, body, and flavor",
      "Coffee grading and scoring techniques",
      "Defect identification",
      "Flavor profiling and classification",
      "Global cupping protocols",
      "Coffee origin and processing methods",
    ],
    experienceTitle: "Hands-On Professional Training",
    experiencePoints: [
      "Real coffee samples",
      "Guided cupping sessions",
      "Flavor comparison exercises",
      "Expert-led demonstrations",
    ],
    opportunityTitle: "Where This Skill Can Take You",
    opportunities: [
      "Work with exporters and coffee companies",
      "Become a professional cupper",
      "Add value to your coffee business",
      "Build authority with international buyers",
    ],
    priceTitle: "Invest in a High-Value Skill.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: [
      "Full practical training",
      "Coffee samples",
      "Certification",
      "Professional guidance",
    ],
    testimonials: [
      "I now understand coffee quality at a professional level.",
      "This training changed how I see coffee business.",
      "I gained real skills used in export markets.",
    ],
    finalTitle: "Become a Coffee Expert Today.",
    finalSubtitle: "Join a small professional group and upgrade your expertise.",
    seatsLeft: 6,
  },
  "digital-marketing": {
    slug: "digital-marketing",
    label: "Digital Marketing & Online Sales",
    eyebrow: "High-Income Digital Skill",
    icon: Megaphone,
    heroImage:
      "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1400&q=80",
    headline: "Make Money Online Using Just Your Phone.",
    subheadline:
      "Learn how to sell products, run ads, and generate income using Facebook, TikTok, WhatsApp, Telegram, and digital tools.",
    urgency: "Next batch is filling fast. Limited seats only.",
    painTitle: "Why Most People Struggle Financially Today",
    painPoints: [
      "No digital skills",
      "Depending only on salary",
      "No online income source",
      "Businesses failing because they cannot market",
      "Social media is used for scrolling instead of selling",
    ],
    truth:
      "People are making money online every day, but most people do not know the system.",
    solutionTitle: "The Internet Is the New Marketplace",
    solutionIntro:
      "Customers are already on Facebook, TikTok, Instagram, WhatsApp, and Telegram.",
    solutionPoints: [
      "Sell products without a physical shop",
      "Create content that attracts customers",
      "Run Facebook and Instagram ads",
      "Use WhatsApp and Telegram for sales",
      "Close customers and make profit",
    ],
    skillsTitle: "Practical Skills You Will Gain",
    skills: [
      "Facebook and TikTok selling",
      "Content creation for customer attraction",
      "Facebook and Instagram ads",
      "WhatsApp and Telegram sales funnels",
      "Selling without holding stock",
      "Personal brand building",
      "Customer closing and follow-up",
    ],
    experienceTitle: "Real Income Training",
    experiencePoints: [
      "Real examples",
      "Step-by-step guidance",
      "Live demonstrations",
      "Hands-on practice",
    ],
    opportunityTitle: "How You Can Make Money After Training",
    opportunities: [
      "Sell products online without a shop",
      "Manage social media pages for businesses",
      "Freelance as a digital marketer",
      "Start your own online business",
      "Run ads for companies and get paid",
    ],
    priceTitle: "Small Investment. High Income Potential.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I started getting customers online after this training.",
      "Now I understand how to sell using Facebook.",
      "This changed how I see business.",
    ],
    finalTitle: "Start Making Money Online Today.",
    finalSubtitle: "TikTok to landing page to WhatsApp to close. Learn the system.",
    seatsLeft: 11,
  },
  "ai-for-business": {
    slug: "ai-for-business",
    label: "AI for Business",
    eyebrow: "Automation & Growth Training",
    icon: Bot,
    heroImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80",
    headline: "Use AI to Save Time, Sell More, and Grow Your Business.",
    subheadline:
      "Learn practical AI tools for marketing, operations, customer support, content, and business automation.",
    urgency: "Limited seats available. Next batch starting soon.",
    painTitle: "Business Is Moving Faster",
    painPoints: [
      "Manual work wastes time",
      "Content creation takes too long",
      "Customer response is slow",
      "Competitors are adopting AI tools",
      "Teams need practical systems, not hype",
    ],
    truth: "AI is useful only when it is connected to real business workflows.",
    solutionTitle: "Practical AI for Revenue and Productivity",
    solutionIntro:
      "TESBINN teaches AI through business tasks you can use immediately.",
    solutionPoints: [
      "Create marketing content faster",
      "Automate repetitive business tasks",
      "Improve sales follow-up",
      "Use AI for research and planning",
      "Build simple workflows for teams",
    ],
    skillsTitle: "AI Skills You Will Gain",
    skills: [
      "Prompting for business results",
      "AI content and campaign planning",
      "Customer support automation",
      "Sales scripts and follow-up workflows",
      "Market research with AI tools",
      "Productivity systems for daily operations",
    ],
    experienceTitle: "Practical Tool-Based Training",
    experiencePoints: [
      "Live demonstrations",
      "Business use cases",
      "Workflow templates",
      "Hands-on practice with AI tools",
    ],
    opportunityTitle: "What AI Can Help You Achieve",
    opportunities: [
      "Reduce manual workload",
      "Create better marketing faster",
      "Improve customer response speed",
      "Grow revenue with smarter systems",
      "Offer AI support services to businesses",
    ],
    priceTitle: "Affordable Investment. Immediate Productivity Return.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I now use AI to create business content faster.",
      "The training showed practical tools, not theory.",
      "AI helped my team respond to customers better.",
    ],
    finalTitle: "Upgrade Your Business With AI.",
    finalSubtitle: "Learn the practical systems before your competitors do.",
    seatsLeft: 8,
  },
  "capital-market-training": {
    slug: "capital-market-training",
    label: "Capital Market Training",
    eyebrow: "Capital Market Training",
    icon: TrendingUp,
    heroImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80",
    headline: "Learn Capital Markets and Build Smarter Investment Decisions.",
    subheadline:
      "Understand stocks, bonds, risk, and market opportunities with practical training designed for beginners and business professionals.",
    urgency: "Next batch is filling fast. Limited seats only.",
    painTitle: "Why Most People Lose Money in Markets",
    painPoints: [
      "They invest without understanding risk",
      "They follow rumors instead of analysis",
      "They do not know how stocks, bonds, and markets work",
      "They cannot read market signals",
      "They start without a practical investment plan",
    ],
    truth:
      "Opportunity exists in financial markets, but untrained decisions can become expensive mistakes.",
    solutionTitle: "This Training Makes Capital Markets Practical",
    solutionIntro:
      "TESBINN shows you how markets work, how to evaluate opportunities, and how to think like a disciplined investor.",
    solutionPoints: [
      "Understand stocks, bonds, and market basics",
      "Learn risk management before investing",
      "Read market trends and financial information",
      "Build a practical investment mindset",
      "Avoid emotional buying and selling",
    ],
    skillsTitle: "Investment Skills You Will Gain",
    skills: [
      "Capital market fundamentals",
      "Stock and bond market understanding",
      "Risk and return analysis",
      "Portfolio thinking",
      "Market research habits",
      "Practical investment decision-making",
    ],
    experienceTitle: "Practical Financial Market Training",
    experiencePoints: [
      "Real market examples",
      "Step-by-step explanations",
      "Risk-focused learning",
      "Investment decision frameworks",
    ],
    opportunityTitle: "What This Skill Can Help You Do",
    opportunities: [
      "Make more informed investment decisions",
      "Understand Ethiopia and global market opportunities",
      "Support your business or personal finance goals",
      "Build confidence before entering financial markets",
    ],
    priceTitle: "Small Investment. Smarter Financial Decisions.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I finally understood how markets work.",
      "The training helped me avoid emotional investment decisions.",
      "Now I can evaluate opportunities more clearly.",
    ],
    finalTitle: "Start Building Financial Market Confidence.",
    finalSubtitle: "Register before the next capital market batch closes.",
    seatsLeft: 8,
  },
  "sales-marketing-training": {
    slug: "sales-marketing-training",
    label: "Sales & Marketing Training",
    eyebrow: "Sales & Marketing Training",
    icon: BriefcaseBusiness,
    heroImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    headline: "Learn How to Sell Better and Grow Business Revenue.",
    subheadline:
      "Master customer communication, lead follow-up, offer positioning, and practical sales systems that convert attention into paying customers.",
    urgency: "Limited seats. Next sales batch starting soon.",
    painTitle: "Why Many Businesses Struggle to Sell",
    painPoints: [
      "They have products but no clear sales process",
      "They do not know how to handle objections",
      "They depend only on walk-in customers",
      "They do not follow up leads properly",
      "They market without a conversion strategy",
    ],
    truth:
      "Good products do not sell themselves. Sales skill turns interest into revenue.",
    solutionTitle: "This Training Builds Practical Sales Confidence",
    solutionIntro:
      "TESBINN teaches how to attract prospects, communicate value, follow up, and close customers.",
    solutionPoints: [
      "Understand customer needs",
      "Create stronger sales messages",
      "Handle objections with confidence",
      "Follow up leads without losing them",
      "Turn marketing attention into sales",
    ],
    skillsTitle: "Sales Skills You Will Gain",
    skills: [
      "Customer communication",
      "Lead follow-up systems",
      "Offer positioning",
      "Objection handling",
      "Closing techniques",
      "Sales pipeline thinking",
    ],
    experienceTitle: "Real Sales Practice",
    experiencePoints: [
      "Role-play scenarios",
      "Real business examples",
      "Sales scripts and frameworks",
      "Practical closing guidance",
    ],
    opportunityTitle: "Where This Skill Can Take You",
    opportunities: [
      "Increase business revenue",
      "Get better sales or marketing jobs",
      "Sell your own products with confidence",
      "Help companies convert more customers",
    ],
    priceTitle: "Small Investment. Direct Revenue Skill.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I learned how to talk to customers with confidence.",
      "My follow-up improved after this training.",
      "The sales examples were practical and clear.",
    ],
    finalTitle: "Turn Attention Into Paying Customers.",
    finalSubtitle: "Join the next sales and marketing batch.",
    seatsLeft: 10,
  },
  "customer-service-training": {
    slug: "customer-service-training",
    label: "Customer Service Training",
    eyebrow: "Customer Service Training",
    icon: Users,
    heroImage:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80",
    headline: "Become the Professional Customers Trust and Remember.",
    subheadline:
      "Learn professional communication, complaint handling, service recovery, and customer experience skills for work and business.",
    urgency: "Limited seats. Next batch starting soon.",
    painTitle: "Why Customer Experience Breaks Businesses",
    painPoints: [
      "Slow response loses customers",
      "Poor communication damages reputation",
      "Teams do not know how to handle complaints",
      "Customers leave when service feels careless",
      "Businesses lose repeat sales from weak service",
    ],
    truth:
      "Customer service is not politeness only. It is a revenue and reputation skill.",
    solutionTitle: "This Training Builds Service Professionals",
    solutionIntro:
      "TESBINN teaches how to communicate, solve problems, handle pressure, and create loyal customers.",
    solutionPoints: [
      "Handle complaints professionally",
      "Communicate clearly with customers",
      "Build trust in every interaction",
      "Improve response and follow-up habits",
      "Support sales through better service",
    ],
    skillsTitle: "Service Skills You Will Gain",
    skills: [
      "Professional communication",
      "Complaint handling",
      "Customer psychology basics",
      "Service recovery",
      "Phone and chat etiquette",
      "Loyalty-building habits",
    ],
    experienceTitle: "Practical Customer Interaction Training",
    experiencePoints: [
      "Real service scenarios",
      "Complaint handling practice",
      "Communication scripts",
      "Service recovery examples",
    ],
    opportunityTitle: "Where This Skill Can Take You",
    opportunities: [
      "Work in customer support roles",
      "Improve your business reputation",
      "Increase repeat customers",
      "Become more valuable in any service business",
    ],
    priceTitle: "Affordable Investment. Valuable Workplace Skill.",
    priceLine: "Training Fee: 9,900 ETB - 35,000 ETB",
    includes: sharedIncludes,
    testimonials: [
      "I learned how to handle difficult customers calmly.",
      "The training improved my communication at work.",
      "This course is useful for any business.",
    ],
    finalTitle: "Upgrade Your Customer Service Skill.",
    finalSubtitle: "Secure your seat before the next service training starts.",
    seatsLeft: 9,
  },
};

const iconByCategory: Record<string, TrainingLandingConfig["icon"]> = {
  marketing: Megaphone,
  ai: Bot,
  business: BriefcaseBusiness,
  leadership: Users,
  productivity: Target,
  development: GraduationCap,
  design: Sparkles,
  other: BookOpen,
};

const getPromotionProfile = (course: Course): CoursePromotionProfile => {
  const title = course.title.toLowerCase();

  if (title.includes("capital") || title.includes("stock") || title.includes("market")) {
    return {
      eyebrow: "Capital Market Training",
      icon: TrendingUp,
      headline: "Learn Capital Markets and Build Smarter Investment Decisions.",
      painTitle: "Why Most People Lose Money in Markets",
      painPoints: [
        "They invest without understanding risk",
        "They follow rumors instead of analysis",
        "They do not know how stocks, bonds, and markets work",
        "They cannot read market signals",
        "They start without a practical investment plan",
      ],
      truth:
        "Opportunity exists in financial markets, but untrained decisions can become expensive mistakes.",
      solutionTitle: "This Training Makes Capital Markets Practical",
      solutionIntro:
        "Learn how markets work, how to evaluate opportunities, and how to think like a disciplined investor.",
      solutionPoints: [
        "Understand stocks, bonds, and market basics",
        "Learn risk management before investing",
        "Read market trends and financial information",
        "Build a practical investment mindset",
        "Avoid emotional buying and selling",
      ],
      skillsTitle: "Investment Skills You Will Gain",
      skills: [
        "Capital market fundamentals",
        "Stock and bond market understanding",
        "Risk and return analysis",
        "Portfolio thinking",
        "Market research habits",
        "Practical investment decision-making",
      ],
      opportunityTitle: "What This Skill Can Help You Do",
      opportunities: [
        "Make more informed investment decisions",
        "Understand Ethiopia and global market opportunities",
        "Support your business or personal finance goals",
        "Build confidence before entering financial markets",
      ],
      testimonials: [
        "I finally understood how markets work.",
        "The training helped me avoid emotional investment decisions.",
        "Now I can evaluate opportunities more clearly.",
      ],
      finalTitle: "Start Building Financial Market Confidence.",
      finalSubtitle: "Register before the next capital market batch closes.",
    };
  }

  if (title.includes("sales")) {
    return {
      eyebrow: "Sales & Marketing Training",
      icon: BriefcaseBusiness,
      headline: "Learn How to Sell Better and Grow Business Revenue.",
      painTitle: "Why Many Businesses Struggle to Sell",
      painPoints: [
        "They have products but no clear sales process",
        "They do not know how to handle objections",
        "They depend only on walk-in customers",
        "They do not follow up leads properly",
        "They market without a conversion strategy",
      ],
      truth:
        "Good products do not sell themselves. Sales skill turns interest into revenue.",
      solutionTitle: "This Training Builds Practical Sales Confidence",
      solutionIntro:
        "Learn how to attract prospects, communicate value, follow up, and close customers.",
      solutionPoints: [
        "Understand customer needs",
        "Create stronger sales messages",
        "Handle objections with confidence",
        "Follow up leads without losing them",
        "Turn marketing attention into sales",
      ],
      skillsTitle: "Sales Skills You Will Gain",
      skills: [
        "Customer communication",
        "Lead follow-up systems",
        "Offer positioning",
        "Objection handling",
        "Closing techniques",
        "Sales pipeline thinking",
      ],
      opportunityTitle: "Where This Skill Can Take You",
      opportunities: [
        "Increase business revenue",
        "Get better sales or marketing jobs",
        "Sell your own products with confidence",
        "Help companies convert more customers",
      ],
      testimonials: [
        "I learned how to talk to customers with confidence.",
        "My follow-up improved after this training.",
        "The sales examples were practical and clear.",
      ],
      finalTitle: "Turn Attention Into Paying Customers.",
      finalSubtitle: "Join the next sales and marketing batch.",
    };
  }

  if (title.includes("customer")) {
    return {
      eyebrow: "Customer Service Training",
      icon: Users,
      headline: "Become the Professional Customers Trust and Remember.",
      painTitle: "Why Customer Experience Breaks Businesses",
      painPoints: [
        "Slow response loses customers",
        "Poor communication damages reputation",
        "Teams do not know how to handle complaints",
        "Customers leave when service feels careless",
        "Businesses lose repeat sales from weak service",
      ],
      truth:
        "Customer service is not politeness only. It is a revenue and reputation skill.",
      solutionTitle: "This Training Builds Service Professionals",
      solutionIntro:
        "Learn how to communicate, solve problems, handle pressure, and create loyal customers.",
      solutionPoints: [
        "Handle complaints professionally",
        "Communicate clearly with customers",
        "Build trust in every interaction",
        "Improve response and follow-up habits",
        "Support sales through better service",
      ],
      skillsTitle: "Service Skills You Will Gain",
      skills: [
        "Professional communication",
        "Complaint handling",
        "Customer psychology basics",
        "Service recovery",
        "Phone and chat etiquette",
        "Loyalty-building habits",
      ],
      opportunityTitle: "Where This Skill Can Take You",
      opportunities: [
        "Work in customer support roles",
        "Improve your business reputation",
        "Increase repeat customers",
        "Become more valuable in any service business",
      ],
      testimonials: [
        "I learned how to handle difficult customers calmly.",
        "The training improved my communication at work.",
        "This course is useful for any business.",
      ],
      finalTitle: "Upgrade Your Customer Service Skill.",
      finalSubtitle: "Secure your seat before the next service training starts.",
    };
  }

  if (title.includes("logistics") || title.includes("supply")) {
    return {
      eyebrow: "Logistics & Supply Chain Training",
      icon: Ship,
      headline: "Master Product Movement, Delivery, and Supply Chain Operations.",
      painTitle: "Why Businesses Lose Money in Logistics",
      painPoints: [
        "Poor planning creates delays",
        "Shipping and documentation feel confusing",
        "Inventory is not managed properly",
        "Costs rise because processes are unclear",
        "Teams do not understand end-to-end movement",
      ],
      truth:
        "Logistics knowledge protects profit because every delay, mistake, and missing document costs money.",
      solutionTitle: "This Training Makes Supply Chain Operations Clear",
      solutionIntro:
        "Learn how goods move, how logistics decisions are made, and how to reduce operational mistakes.",
      solutionPoints: [
        "Understand supply chain flow",
        "Learn shipping and delivery basics",
        "Manage inventory and operations better",
        "Understand documents and coordination",
        "Reduce costly logistics errors",
      ],
      skillsTitle: "Operational Skills You Will Gain",
      skills: [
        "Supply chain fundamentals",
        "Logistics coordination",
        "Inventory planning",
        "Shipping and delivery process",
        "Documentation basics",
        "Cost and delay control",
      ],
      opportunityTitle: "Where This Skill Can Take You",
      opportunities: [
        "Work in logistics and operations roles",
        "Improve import/export execution",
        "Support business delivery systems",
        "Reduce operational waste and delays",
      ],
      testimonials: [
        "I now understand how goods move from supplier to customer.",
        "The training made logistics much clearer.",
        "This helped me improve business operations.",
      ],
      finalTitle: "Build Practical Logistics Confidence.",
      finalSubtitle: "Register before the next logistics batch fills.",
    };
  }

  return {
    eyebrow: `${course.category.replace(/(^|\s|-)\w/g, (match) => match.toUpperCase())} Training`,
    icon: iconByCategory[course.category] || BookOpen,
    headline: `Build Practical Skills With ${course.title}.`,
    painTitle: "Why Most Learners Do Not Get Results",
    painPoints: [
      "They learn theory without practical application",
      "They do not get a clear action plan",
      "They delay registration until batches are full",
      "They lack direct access to expert guidance",
      "They miss market-ready skills that employers and businesses need",
    ],
    truth:
      "Skills create income only when the training is practical, focused, and followed by action.",
    solutionTitle: `TESBINN Makes ${course.title} Practical`,
    solutionIntro:
      "This course is built to help learners understand the topic, practice the skill, and apply it in real work or business situations.",
    solutionPoints: [
      "Learn from experienced instructors",
      "Follow structured lessons and practical sessions",
      "Build confidence through guided examples",
      "Get business and career-focused guidance",
      "Leave with a clearer next step",
    ],
    skillsTitle: "What You Will Gain",
    skills: [
      `Core knowledge in ${course.title}`,
      "Practical exercises and guided learning",
      "Market-ready skill development",
      "Career and business application ideas",
      "Certification after completion",
      "Access to TESBINN learning support",
    ],
    opportunityTitle: "What This Training Can Help You Achieve",
    opportunities: [
      "Upgrade your current skill set",
      "Improve your income potential",
      "Apply the skill in business or employment",
      "Build confidence with practical knowledge",
      "Join a growing network of TESBINN learners",
    ],
    testimonials: [
      "The training helped me understand the subject clearly.",
      "TESBINN courses are practical and easy to follow.",
      "I gained skills I can use for work and business.",
    ],
    finalTitle: `Ready to Join ${course.title}?`,
    finalSubtitle: "Register now and talk to the TESBINN team before the next batch closes.",
  };
};

const courseToLandingConfig = (course: Course): TrainingLandingConfig => {
  const price = Number(course.price || 0);
  const lessons = (course.modules || []).reduce(
    (sum, module) => sum + (module.lessons || []).length,
    0
  );
  const courseDuration = minutesToDurationLabel(course.duration);
  const image = course.imageUrl?.startsWith("http") ? course.imageUrl : backgroundImage;
  const profile = getPromotionProfile(course);

  return {
    slug: course._id,
    label: course.title,
    eyebrow: profile.eyebrow,
    icon: profile.icon,
    heroImage: image,
    headline: profile.headline,
    subheadline:
      course.description ||
      `Join TESBINN and learn ${course.title} through practical, market-driven training.`,
    urgency: "Limited seats available. Next batch starting soon.",
    painTitle: profile.painTitle,
    painPoints: profile.painPoints,
    truth: profile.truth,
    solutionTitle: profile.solutionTitle,
    solutionIntro: profile.solutionIntro,
    solutionPoints: profile.solutionPoints,
    skillsTitle: profile.skillsTitle,
    skills: profile.skills,
    experienceTitle: "Designed for Practical Learning",
    experiencePoints: [
      `${lessons || "Multiple"} focused lessons`,
      `${courseDuration} of structured learning`,
      `${course.teacher?.name || "TESBINN"} instructor guidance`,
      "Online, in-class, or hybrid learning options",
    ],
    opportunityTitle: profile.opportunityTitle,
    opportunities: profile.opportunities,
    priceTitle: price > 0 ? "Affordable Investment. Practical Return." : "Start Learning With TESBINN.",
    priceLine: price > 0 ? `Training Fee: ${price.toLocaleString()} ETB` : "Training Fee: Free",
    includes: [
      "Full course access",
      "Practical sessions",
      "Certification",
      "Instructor guidance",
    ],
    testimonials: profile.testimonials,
    finalTitle: profile.finalTitle,
    finalSubtitle: profile.finalSubtitle,
    seatsLeft: 10,
  };
};

const SectionHeader = ({
  eyebrow,
  title,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  center?: boolean;
}) => (
  <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
    {eyebrow && (
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
    )}
    <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
      {title}
    </h2>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {items.map((item) => (
      <div key={item} className="flex gap-3 rounded-lg border border-border bg-card p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
        <span className="text-sm leading-6 text-foreground">{item}</span>
      </div>
    ))}
  </div>
);

const ImportExportPromo = ({ training }: { training: TrainingLandingConfig }) => {
  const registerUrl = `/register?course=${encodeURIComponent(training.label)}`;
  const skillCards = [
    {
      icon: PackageSearch,
      title: "Supplier Sourcing",
      text: "Find trusted suppliers and quality products at the best price.",
    },
    {
      icon: ShoppingCart,
      title: "High-Profit Product Selection",
      text: "Choose fast-moving products and maximize your margins.",
    },
    {
      icon: Handshake,
      title: "Price Negotiation",
      text: "Negotiate better prices and build win-win relationships.",
    },
    {
      icon: Ship,
      title: "Shipping, Customs & Logistics",
      text: "Understand shipping methods, customs process, and logistics flow.",
    },
    {
      icon: ShieldCheck,
      title: "Safe Payment Methods",
      text: "Use secure transaction methods and protect your money.",
    },
    {
      icon: FileCheck2,
      title: "Export Documentation",
      text: "Handle export documents and sell products worldwide.",
    },
  ];

  const opportunityCards = [
    {
      icon: Globe2,
      title: "Global Market Access",
      text: "Tap into global demand and bigger business opportunities.",
    },
    {
      icon: TrendingUp,
      title: "Higher Profits",
      text: "Build deals with better margins and repeat buyers.",
    },
    {
      icon: WalletCards,
      title: "Business Freedom",
      text: "Create income through import, export, and trade networks.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#071f45]">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[#071f45] lg:block" />
          <div className="absolute right-[47%] top-0 hidden h-full w-24 skew-x-[-10deg] bg-[#d49a15] lg:block" />
          <div className="container-wide section-padding relative grid min-h-screen gap-8 py-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
            <div className="flex flex-col">
              <div className="flex max-w-2xl items-center gap-3">
                <img
                  src={tesbinnLogo}
                  alt="TESBINN"
                  className="h-16 w-16 flex-none rounded-full object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                />
                <div>
                  <p className="text-3xl font-black leading-none tracking-[0.15em] text-[#1c315f] sm:text-4xl lg:text-5xl">
                    TESBINN
                  </p>
                  <p className="mt-1.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#1c315f] sm:text-xs lg:text-sm">
                    Trade Ethiopia School of Business & Innovation
                  </p>
                  <p className="mt-1.5 text-base font-black tracking-[0.08em] text-[#b17c00] sm:text-xl lg:text-2xl">
                    ትሬድ ኢትዮጵያ የቢዝነስ እና ፈጠራ ትምህርት
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-[0.08em] text-[#1c315f] sm:text-3xl lg:text-4xl">
                    Innovate today!
                  </p>
                </div>
              </div>

              <div className="mt-10 max-w-2xl">
                <p className="text-4xl font-black uppercase leading-[0.96] tracking-tight text-[#071f45] sm:text-5xl lg:text-6xl">
                  The opportunity is there
                </p>
                <p className="mt-2 text-3xl font-black uppercase leading-[0.98] tracking-tight text-[#071f45] sm:text-4xl lg:text-5xl">
                  but knowledge gap is
                </p>
                <p className="mt-2 text-4xl font-black uppercase leading-[0.96] tracking-tight text-[#b17c00] sm:text-5xl lg:text-6xl">
                  costing you money every day
                </p>
              </div>

              <div className="mt-8 inline-flex w-fit items-center overflow-hidden rounded-full border-2 border-[#d49a15] bg-[#071f45] pr-8 shadow-lg">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#071f45] text-[#f4b629]">
                  <Ship className="h-10 w-10" />
                </div>
                <span className="text-2xl font-black uppercase tracking-wide text-white sm:text-4xl">
                  Import Export
                </span>
              </div>

              <div className="mt-8 grid gap-4">
                {skillCards.map((item) => (
                  <div key={item.title} className="grid grid-cols-[4rem_1fr] items-start gap-4 border-b border-dashed border-[#071f45]/30 pb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d49a15] bg-[#071f45] text-[#f4b629]">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase leading-tight text-[#071f45]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-5 text-[#071f45]/78">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-[#071f45] p-4 text-white shadow-2xl lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border-4 border-[#d49a15] bg-[#071f45] shadow-2xl lg:min-h-[520px]">
                <img
                  src={training.heroImage}
                  alt="Import export containers"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071f45]/85 via-[#071f45]/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 text-[#071f45] shadow-xl">
                  <p className="text-lg font-black uppercase">Stop struggling locally</p>
                  <p className="text-2xl font-black uppercase text-[#b17c00]">
                    Start trading globally
                  </p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border-2 border-[#d49a15] bg-[#071f45] p-6 shadow-2xl">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#071f45]">
                  <Globe2 className="h-7 w-7" />
                </div>
                <h2 className="text-center text-3xl font-black uppercase leading-tight">
                  Stop Struggling Locally
                  <span className="block text-[#f4b629]">Start Trading Globally</span>
                  <span className="block">Make Real Money</span>
                </h2>
                <div className="mt-5 grid gap-4">
                  {opportunityCards.map((item) => (
                    <div key={item.title} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 border-b border-dashed border-white/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#f4b629] text-[#f4b629]">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xl font-black uppercase text-[#f4b629]">{item.title}</p>
                        <p className="text-sm leading-5 text-white/85">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="h-20 rounded-full border-4 border-white bg-red-600 text-3xl font-black uppercase shadow-2xl hover:bg-red-700"
                asChild
              >
                <Link to={registerUrl}>
                  <ArrowRight className="mr-4 h-10 w-10 rounded-full bg-white p-2 text-red-600" />
                  Register Now
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-[#071f45] py-7 text-white">
          <div className="container-wide section-padding grid gap-5 md:grid-cols-3">
            {[
              {
                icon: CalendarDays,
                title: "Flexible Schedules",
                text: "Learn at your convenience.",
              },
              {
                icon: Sparkles,
                title: "Practical Training",
                text: "Hands-on real-world business skills.",
              },
              {
                icon: BriefcaseBusiness,
                title: "Job & Business Opportunities",
                text: "Connect skills to growth and income.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 border-[#d49a15] md:border-r md:last:border-0">
                <item.icon className="h-12 w-12 flex-none text-[#f4b629]" />
                <div>
                  <p className="text-xl font-black uppercase">{item.title}</p>
                  <p className="text-sm text-white/78">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="container-narrow section-padding text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#b17c00]">
              Limited seats available
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase text-[#071f45] md:text-5xl">
              Learn import export step by step
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#071f45]/75">
              Practical sessions, certification, business guidance, supplier sourcing,
              product selection, logistics, payments, and export documentation.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button className="bg-red-600 hover:bg-red-700" asChild>
                <Link to={registerUrl}>Register Now</Link>
              </Button>
              <Button variant="outline" className="border-[#071f45] text-[#071f45]" asChild>
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with TESBINN on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
};

const TrainingLanding = () => {
  const location = useLocation();
  const { courseId } = useParams();
  const slug = location.pathname.replace(/^\/+/, "");
  const staticTraining = trainings[slug];
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    let active = true;

    if (!courseId) {
      setCourse(null);
      setCourseError("");
      setIsLoadingCourse(false);
      return undefined;
    }

    const load = async () => {
      setIsLoadingCourse(true);
      setCourseError("");
      try {
        const res = await api.get<ApiResponse<Course>>(`/courses/${courseId}`);
        if (!active) return;
        setCourse(res.data.data);
      } catch (error: any) {
        if (!active) return;
        setCourse(null);
        setCourseError(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Could not load this course."
        );
      } finally {
        if (active) setIsLoadingCourse(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId]);

  const dynamicTraining = useMemo(
    () => (course && !isExcludedFunnelCourse(course.title) ? courseToLandingConfig(course) : null),
    [course]
  );
  const training = staticTraining || dynamicTraining;

  if (courseId && isLoadingCourse) {
    return (
      <div className="min-h-screen bg-background">
        <main>
          <div className="container-wide section-padding py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
            <h1 className="text-2xl font-bold text-foreground">Loading course funnel...</h1>
          </div>
        </main>
      </div>
    );
  }

  if (courseId && course && isExcludedFunnelCourse(course.title)) {
    return <Navigate to={`/course/${course._id}`} replace />;
  }

  if (courseId && courseError) {
    return <Navigate to="/courses" replace />;
  }

  if (!training) {
    return <Navigate to="/courses" replace />;
  }

  const Icon = training.icon;
  const registerUrl = `/register?course=${encodeURIComponent(training.label)}`;

  if (training.slug === "import-export-training") {
    return <ImportExportPromo training={training} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="relative overflow-hidden bg-secondary text-primary-foreground">
          <div className="absolute inset-0">
            <img
              src={training.heroImage}
              alt={training.label}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-secondary/85" />
          </div>
          <div className="container-wide section-padding relative grid gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-primary" />
                {training.eyebrow}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {training.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 md:text-lg">
                {training.subheadline}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <Link to={registerUrl}>
                    Register Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-secondary"
                  asChild
                >
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-primary-foreground/85">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  {training.urgency}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  Only {training.seatsLeft} seats left
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 shadow-xl backdrop-blur">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
                <img
                  src={training.heroImage}
                  alt={`${training.label} training preview`}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/25">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Play className="ml-1 h-7 w-7 fill-current" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/80">
                Practical training. Real examples. Real action plan.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-card py-10">
          <div className="container-wide section-padding grid gap-4 md:grid-cols-4">
            {[
              { icon: WalletCards, label: training.priceLine.replace("Training Fee: ", "") },
              { icon: GraduationCap, label: "Certification included" },
              { icon: ShieldCheck, label: "Online, in-class, hybrid" },
              { icon: MessageCircle, label: "Fast WhatsApp support" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <SectionHeader eyebrow="The problem" title={training.painTitle} />
              <p className="mt-4 rounded-lg border-l-4 border-primary bg-primary/10 p-4 text-sm font-medium leading-6 text-foreground">
                {training.truth}
              </p>
            </div>
            <BulletList items={training.painPoints} />
          </div>
        </section>

        <section className="bg-muted/50 py-12 lg:py-16">
          <div className="container-wide section-padding grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeader eyebrow="The solution" title={training.solutionTitle} />
              <p className="mt-4 text-muted-foreground">{training.solutionIntro}</p>
            </div>
            <BulletList items={training.solutionPoints} />
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding">
            <SectionHeader eyebrow="What you master" title={training.skillsTitle} center />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {training.skills.map((skill) => (
                <div key={skill} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <Target className="mb-4 h-6 w-6 text-primary" />
                  <p className="text-sm font-medium leading-6 text-foreground">{skill}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-12 text-primary-foreground lg:py-16">
          <div className="container-wide section-padding grid gap-8 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">
                Training experience
              </p>
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                {training.experienceTitle}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {training.experiencePoints.map((point) => (
                <div key={point} className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-5">
                  <Sparkles className="mb-4 h-5 w-5 text-primary" />
                  <p className="text-sm leading-6 text-primary-foreground/85">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-wide section-padding grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader eyebrow="Income opportunity" title={training.opportunityTitle} />
              <div className="mt-6 space-y-3">
                {training.opportunities.map((item) => (
                  <div key={item} className="flex gap-3">
                    <TrendingUp className="mt-1 h-5 w-5 flex-none text-primary" />
                    <p className="leading-7 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <SectionHeader eyebrow="Pricing" title={training.priceTitle} />
              <p className="mt-4 text-2xl font-bold text-primary">{training.priceLine}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {training.includes.map((item) => (
                  <div key={item} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to={registerUrl}>Register Now</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Ask a Question
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card py-12 lg:py-16">
          <div className="container-wide section-padding">
            <SectionHeader eyebrow="Student proof" title="Real People. Real Results." center />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {training.testimonials.map((quote) => (
                <div key={quote} className="rounded-lg border border-border bg-background p-6 shadow-sm">
                  <div className="mb-4 flex">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">"{quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary py-12 text-primary-foreground lg:py-16">
          <div className="container-narrow section-padding text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/15">
              <Globe2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold md:text-4xl">{training.finalTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
              {training.finalSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button className="bg-secondary hover:bg-secondary/90" asChild>
                <Link to={registerUrl}>Register Now</Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Talk to Our Team
                </a>
              </Button>
            </div>
            <p className="mt-5 text-sm font-medium text-primary-foreground/85">
              Addis Ababa | +251 92 924 3367 | contact@tesbinn.com
            </p>
          </div>
        </section>
      </main>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with TESBINN on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition-transform hover:scale-105"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
};

export default TrainingLanding;
