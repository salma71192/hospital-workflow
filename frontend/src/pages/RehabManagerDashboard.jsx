
import React, { useMemo, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import AdminStatisticsSection from "../components/admin/AdminStatisticsSection";

export default function RehabManagerDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("home");

  const currentUser = actingAs || user;
  const displayName =
    currentUser?.name ||
    currentUser?.display_name ||
    currentUser?.full_name ||
    currentUser?.username ||
    "Rehab Manager";

  const menuItems = [
    {
      label: "Rehabilitation Statistics",
      description: "Review daily and monthly department statistics.",
      icon: "▥",
      color: "blue",
      action: "statistics",
    },
    {
      label: "Evaluation Tracker",
      description: "Monitor evaluations and patient allocation.",
      icon: "☷",
      path: "/admin/evaluation-tracker",
      color: "purple",
    },
    {
      label: "Physiotherapist Performance",
      description: "Review therapist activity and performance.",
      icon: "↗",
      path: "/admin/performance",
      color: "green",
    },
    {
      label: "Leave Management",
      description: "Review staff leave and coverage.",
      icon: "▣",
      path: "/admin/leaves",
      color: "orange",
    },
    {
      label: "User Administration",
      description: "Manage application users and access.",
      icon: "♙",
      path: "/admin",
      color: "red",
    },
  ];

  const dailyMessage = useMemo(() => {
    const messages = [
      {
        category: "Leadership",
        title: "Lead by Example",
        message:
          "Demonstrate the professionalism, accountability, and respect you expect from your team. Consistent leadership builds trust and encourages staff to maintain high standards of patient care.",
      },
      {
        category: "Team Management",
        title: "Build a Strong, Balanced Team",
        message:
          "Distribute patient assignments fairly while considering therapist availability, clinical expertise, workload, and patient needs. Balanced scheduling supports service quality and helps the whole team work toward shared targets.",
      },
      {
        category: "Communication",
        title: "Communicate with Clarity",
        message:
          "Give clear instructions, explain expectations, and invite questions. Regular communication helps prevent misunderstandings, improves coordination, and keeps the department focused on common goals.",
      },
      {
        category: "Decision-Making",
        title: "Make Decisions Based on Evidence",
        message:
          "Use reliable data, staff feedback, patient needs, and operational priorities when making decisions. Review the outcomes afterward and adjust your approach when the evidence suggests a better solution.",
      },
      {
        category: "Performance Management",
        title: "Measure Progress, Not Just Numbers",
        message:
          "Review productivity alongside patient outcomes, documentation quality, attendance, and patient experience. Performance measures are most useful when they identify opportunities for improvement rather than simply comparing staff.",
      },
      {
        category: "Conflict Resolution",
        title: "Address Concerns Early",
        message:
          "Listen to all parties, clarify the facts, and focus on practical solutions. Addressing concerns respectfully and promptly can prevent small misunderstandings from affecting teamwork or patient care.",
      },
      {
        category: "Staff Development",
        title: "Coach Before You Criticize",
        message:
          "When performance falls below expectations, discuss the specific concern, understand the barriers, and agree on achievable improvement steps. Constructive feedback should include guidance, support, and follow-up.",
      },
      {
        category: "Operational Excellence",
        title: "Turn Department Goals into Action",
        message:
          "Break monthly objectives into measurable weekly and daily priorities. Assign responsibilities clearly, monitor progress, and address obstacles early so the team can work toward targets without unnecessary pressure.",
      },
      {
        category: "Delegation",
        title: "Delegate with Trust and Accountability",
        message:
          "Match responsibilities to staff skills and capacity. Explain the expected result, provide the resources needed, and agree on a follow-up point while allowing team members appropriate independence.",
      },
      {
        category: "Patient-Centered Leadership",
        title: "Keep Patient Care at the Center",
        message:
          "Operational targets matter, but they should support safe, effective, patient-centered rehabilitation. Consider clinical needs, continuity of care, and patient preferences when reviewing schedules and department processes.",
      },
      {
        category: "Change Management",
        title: "Explain the Reason for Change",
        message:
          "When introducing a new process, explain the problem it addresses, the expected benefits, and how success will be measured. Invite feedback and review the implementation to identify practical improvements.",
      },
      {
        category: "Time Management",
        title: "Protect Time for Important Work",
        message:
          "Prioritize tasks that affect patient safety, staff coordination, and department performance. Use a clear daily plan, delegate appropriate responsibilities, and reserve time to review results and resolve emerging issues.",
      },
      {
        category: "Staff Motivation",
        title: "Recognize Contributions",
        message:
          "Acknowledge specific examples of teamwork, clinical improvement, initiative, and reliability. Meaningful recognition helps staff understand what is valued and encourages positive behaviors across the department.",
      },
      {
        category: "Fairness and Accountability",
        title: "Apply Standards Consistently",
        message:
          "Use transparent criteria for scheduling, workload distribution, performance reviews, and access to opportunities. Consistent decisions help build confidence in management and reduce perceptions of favoritism.",
      },
      {
        category: "Continuous Improvement",
        title: "Use Problems as Improvement Opportunities",
        message:
          "When delays, missed appointments, or workflow issues occur, look beyond individual mistakes to understand the process. Identify the underlying causes, agree on corrective actions, and check whether the changes work.",
      },
      {
        category: "Strategic Leadership",
        title: "Balance Today's Needs with Tomorrow's Goals",
        message:
          "Manage immediate operational demands while developing longer-term plans for staffing, training, service quality, and growth. Regularly review priorities to keep department decisions aligned with organizational objectives.",
      },
      {
        category: "Meeting Management",
        title: "Make Every Meeting Productive",
        message:
          "Set a clear purpose, focus on the decisions that need to be made, and finish with agreed actions, responsible persons, and deadlines. Share follow-up points so discussions lead to measurable progress.",
      },
      {
        category: "Workplace Wellbeing",
        title: "Support Sustainable Performance",
        message:
          "Monitor workload, staffing gaps, and recurring operational pressures. Encourage early communication about difficulties and look for practical ways to improve efficiency without compromising patient care or staff wellbeing.",
      },
      {
        category: "Professional Development",
        title: "Develop Future Leaders",
        message:
          "Give team members opportunities to take responsibility, contribute ideas, and develop problem-solving skills. Provide appropriate guidance and feedback so staff can grow into greater responsibilities over time.",
      },
      {
        category: "Service Quality",
        title: "Make Improvement Measurable",
        message:
          "Choose a small number of meaningful indicators, establish a baseline, and review progress at regular intervals. Use the findings to guide action and communicate improvements clearly to the team.",
      },
      {
        category: "Accountability",
        title: "Follow Through on Commitments",
        message:
          "Record decisions, assign ownership, and review outstanding actions. Reliable follow-through shows the team that commitments matter and helps prevent important operational issues from being overlooked.",
      },
      {
        category: "Emotional Intelligence",
        title: "Listen Before You Respond",
        message:
          "Give staff the opportunity to explain their concerns before reaching a conclusion. Active listening helps managers understand different perspectives, respond fairly, and make more informed decisions.",
      },
      {
        category: "Resource Management",
        title: "Use Resources Wisely",
        message:
          "Review staffing, appointment capacity, equipment, and administrative processes to identify avoidable waste. Efficient resource management should improve access and workflow while maintaining appropriate clinical standards.",
      },
      {
        category: "Leadership Reflection",
        title: "Review Your Own Leadership",
        message:
          "Regularly reflect on your decisions, communication, and impact on the team. Seek honest feedback, recognize where you can improve, and turn those observations into specific actions for the next working period.",
      },
    ];

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / 86400000
    );

    return messages[
      ((dayOfYear - 1) % messages.length + messages.length) %
        messages.length
    ];
  }, []);

  const openAdministration = () => {
    setView("administration");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHome = () => {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open the real statistics component within this dashboard.
  const openStatistics = () => {
    setView("statistics");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMenuItem = (item) => {
    if (item.action === "statistics") {
      openStatistics();
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const handleBackToAdmin = () => {
    onStopImpersonation?.();
    navigate("/admin");
  };

  return (
    <div className="hw-dashboard">
      <style>{`
        .hw-dashboard {
          --navy: #172c46;
          --navy-light: #223c5c;
          --blue: #3478f6;
          --text: #233750;
          --muted: #7a8ba0;
          --border: #e5ebf3;
          min-height: 100vh;
          background: #f3f6fb;
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .hw-dashboard *, .hw-dashboard *::before, .hw-dashboard *::after {
          box-sizing: border-box;
        }
        .hw-dashboard button { font: inherit; }
        .hw-shell { width: 100%; max-width: 1440px; margin: 0 auto; padding: 30px; }
        .hw-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 28px; }
        .hw-brand { display: flex; align-items: center; gap: 13px; min-width: 0; }
        .hw-brand-logo { display: grid; place-items: center; width: 51px; height: 51px; flex-shrink: 0; border-radius: 15px; background: var(--navy); color: white; font-size: 27px; box-shadow: 0 8px 20px rgba(23,44,70,.16); }
        .hw-brand-title { color: var(--navy); font-size: 21px; font-weight: 900; letter-spacing: -.6px; }
        .hw-brand-title span { color: var(--blue); }
        .hw-brand-subtitle { margin-top: 5px; color: #8291a5; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; }
        .hw-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .hw-user-pill { display: flex; align-items: center; gap: 10px; max-width: 280px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 12px; background: white; color: #526780; font-size: 12px; font-weight: 750; overflow-wrap: anywhere; }
        .hw-avatar { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 10px; background: #eaf1ff; color: #3268d4; font-size: 15px; }
        .hw-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 11px; background: white; color: #405873; font-size: 12px; font-weight: 800; cursor: pointer; transition: .18s ease; }
        .hw-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 15px rgba(32,55,82,.08); }
        .hw-btn-primary { border-color: var(--blue); background: var(--blue); color: white; }
        .hw-btn-danger { border-color: #f3d6d6; background: #fff; color: #c84949; }
        .hw-impersonation { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px 18px; border: 1px solid #cfdefe; border-radius: 15px; background: #edf3ff; }
        .hw-impersonation strong { display: block; color: #2d4f86; font-size: 13px; }
        .hw-impersonation p { margin: 5px 0 0; color: #6c81a2; font-size: 12px; }
        .hw-hero { position: relative; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(180px, .5fr); align-items: center; gap: 20px; min-height: 290px; padding: 40px; overflow: hidden; border-radius: 24px; background: linear-gradient(120deg, #172c46 0%, #234b77 72%, #3478f6 130%); box-shadow: 0 15px 35px rgba(24,52,83,.12); }
        .hw-hero::after { position: absolute; top: -110px; right: 40px; width: 330px; height: 330px; border: 1px solid rgba(255,255,255,.1); border-radius: 50%; content: ""; }
        .hw-hero-content { position: relative; z-index: 1; min-width: 0; }
        .hw-eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 100px; background: rgba(255,255,255,.08); color: #d6e5ff; font-size: 10px; font-weight: 850; letter-spacing: 1.2px; }
        .hw-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #7de2ba; }
        .hw-hero h1 { margin: 22px 0 12px; color: white; font-size: clamp(30px, 4vw, 43px); font-weight: 850; line-height: 1.18; letter-spacing: -1.3px; overflow-wrap: anywhere; }
        .hw-hero h1 span { color: #9ec2ff; }
        .hw-hero p { max-width: 590px; margin: 0; color: #d1deee; font-size: 13px; line-height: 1.9; }
        .hw-hero-note { display: flex; align-items: center; gap: 9px; margin-top: 22px; color: #d5e6fb; font-size: 11px; }
        .hw-hero-note span { display: grid; place-items: center; width: 23px; height: 23px; border-radius: 50%; background: rgba(255,255,255,.14); color: #a9f0d4; }
        .hw-hero-art { position: relative; z-index: 1; display: grid; place-items: center; min-height: 190px; }
        .hw-art-ring { position: absolute; width: 190px; height: 190px; border: 1px solid rgba(255,255,255,.2); border-radius: 50%; }
        .hw-art-ring-inner { position: absolute; width: 140px; height: 140px; border: 1px solid rgba(255,255,255,.19); border-radius: 50%; background: rgba(255,255,255,.035); }
        .hw-art-symbol { display: grid; place-items: center; width: 105px; height: 105px; border: 1px solid rgba(255,255,255,.25); border-radius: 28px; background: rgba(255,255,255,.12); color: white; font-size: 58px; box-shadow: 0 15px 35px rgba(0,0,0,.12); }
        .hw-section { margin-top: 31px; }
        .hw-section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 17px; }
        .hw-section-label { margin-bottom: 7px; color: var(--blue); font-size: 10px; font-weight: 900; letter-spacing: 1.5px; }
        .hw-section-title { margin: 0; color: var(--navy); font-size: 25px; font-weight: 850; letter-spacing: -.7px; }
        .hw-section-description { margin: 7px 0 0; color: var(--muted); font-size: 12px; line-height: 1.8; }
        .hw-section-tag { padding: 9px 12px; border: 1px solid #dfe7f2; border-radius: 9px; background: white; color: #6c7f98; font-size: 10px; font-weight: 850; letter-spacing: .8px; }
        .hw-admin-card { display: flex; align-items: flex-start; gap: 20px; width: 100%; padding: 25px; border: 1px solid #e0e7f1; border-radius: 19px; background: white; color: inherit; text-align: left; cursor: pointer; box-shadow: 0 5px 20px rgba(30,55,83,.035); transition: .2s ease; }
        .hw-admin-card:hover, .hw-module-card:hover { transform: translateY(-3px); border-color: #bfd3f7; box-shadow: 0 14px 30px rgba(37,78,135,.09); }
        .hw-admin-icon { display: grid; place-items: center; width: 59px; height: 59px; flex-shrink: 0; border-radius: 17px; background: #eaf1ff; color: #3478f6; font-size: 30px; }
        .hw-admin-content { flex: 1; min-width: 0; }
        .hw-admin-kicker { margin-bottom: 7px; color: #3478f6; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; }
        .hw-admin-title { margin: 0; color: var(--navy); font-size: 19px; font-weight: 850; line-height: 1.5; }
        .hw-admin-description { max-width: 720px; margin: 8px 0 15px; color: var(--muted); font-size: 12px; line-height: 1.9; }
        .hw-admin-action, .hw-module-open { display: inline-flex; align-items: center; gap: 10px; color: #3478f6; font-size: 12px; font-weight: 850; }
        .hw-admin-arrow { font-size: 18px; transition: transform .2s ease; }
        .hw-admin-card:hover .hw-admin-arrow { transform: translateX(4px); }
        .hw-info { display: flex; align-items: flex-start; gap: 9px; margin-top: 13px; color: #8190a4; font-size: 10px; line-height: 1.8; }
        .hw-info strong { color: #3478f6; }
        .hw-tip { margin-top: 30px; overflow: hidden; border: 1px solid #e1e8f1; border-radius: 19px; background: white; box-shadow: 0 5px 20px rgba(30,55,83,.035); }
        .hw-tip-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 20px 23px; border-bottom: 1px solid #edf1f6; }
        .hw-tip-heading-wrap { display: flex; align-items: center; gap: 12px; }
        .hw-tip-icon { display: grid; place-items: center; width: 43px; height: 43px; border-radius: 13px; background: #eaf1ff; color: #3478f6; font-size: 22px; }
        .hw-tip-kicker { margin-bottom: 4px; color: #3478f6; font-size: 9px; font-weight: 900; letter-spacing: 1.3px; }
        .hw-tip-heading { margin: 0; color: var(--navy); font-size: 16px; font-weight: 850; }
        .hw-tip-badge { padding: 7px 10px; border-radius: 8px; background: #eaf1ff; color: #346bd0; font-size: 9px; font-weight: 850; }
        .hw-tip-body { padding: 23px; }
        .hw-tip-category { display: inline-flex; padding: 6px 9px; border-radius: 7px; background: #eaf1ff; color: #346bd0; font-size: 10px; font-weight: 850; }
        .hw-tip-title { margin: 13px 0 8px; color: var(--navy); font-size: 20px; font-weight: 850; line-height: 1.45; }
        .hw-tip-message { max-width: 900px; margin: 0; color: var(--muted); font-size: 12px; line-height: 1.95; }
        .hw-tip-footer { display: flex; align-items: center; gap: 9px; padding: 14px 23px; border-top: 1px solid #edf1f6; background: #f9fbfd; color: #72849a; font-size: 10px; line-height: 1.7; }
        .hw-tip-footer span { color: #3478f6; font-size: 15px; }
        .hw-admin-page { animation: hw-fade-in .2s ease-out; }
        @keyframes hw-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .hw-page-banner { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding: 30px; overflow: hidden; border-radius: 21px; background: linear-gradient(120deg, #172c46, #294f7e); color: white; }
        .hw-page-banner-content { position: relative; z-index: 1; min-width: 0; }
        .hw-page-banner-kicker { margin-bottom: 10px; color: #a9c8ff; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; }
        .hw-page-banner h1 { margin: 0; font-size: clamp(26px, 3vw, 35px); font-weight: 850; letter-spacing: -.8px; overflow-wrap: anywhere; }
        .hw-page-banner p { max-width: 600px; margin: 10px 0 0; color: #d5e1f0; font-size: 12px; line-height: 1.9; }
        .hw-page-banner .hw-btn { position: relative; z-index: 1; border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.1); color: white; }
        .hw-admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px; margin-top: 22px; }
        .hw-module-card { display: flex; align-items: flex-start; gap: 15px; min-width: 0; min-height: 170px; padding: 23px; border: 1px solid #e1e8f1; border-radius: 17px; background: white; color: inherit; text-align: left; cursor: pointer; box-shadow: 0 4px 17px rgba(30,55,83,.025); transition: .2s ease; }
        .hw-module-icon { display: grid; place-items: center; width: 50px; height: 50px; flex-shrink: 0; border-radius: 14px; font-size: 24px; }
        .hw-module-icon.blue { background: #eaf1ff; color: #3478f6; }
        .hw-module-icon.purple { background: #f1eaff; color: #8559d6; }
        .hw-module-icon.green { background: #e7f8ef; color: #219966; }
        .hw-module-icon.orange { background: #fff1e5; color: #cf7b29; }
        .hw-module-icon.red { background: #ffeded; color: #d25454; }
        .hw-module-content { flex: 1; min-width: 0; }
        .hw-module-content h2 { margin: 2px 0 8px; color: var(--navy); font-size: 15px; font-weight: 850; line-height: 1.5; overflow-wrap: anywhere; }
        .hw-module-content p { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.8; }
        .hw-module-open { gap: 7px; margin-top: 15px; font-size: 11px; }
        .hw-admin-note { display: flex; align-items: flex-start; gap: 11px; margin-top: 22px; padding: 17px; border: 1px solid #e1e8f1; border-radius: 14px; background: #fff; color: #72849a; font-size: 11px; line-height: 1.8; }
        .hw-admin-note-icon { display: grid; place-items: center; width: 31px; height: 31px; flex-shrink: 0; border-radius: 10px; background: #eaf1ff; color: #3478f6; }
        .hw-statistics-wrapper { min-width: 0; margin-top: 22px; overflow: hidden; border: 1px solid #e1e8f1; border-radius: 18px; background: #fff; box-shadow: 0 5px 20px rgba(30,55,83,.035); }
        .hw-statistics-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 17px 20px; border-bottom: 1px solid #e8edf5; background: #fff; }
        .hw-statistics-topbar strong { color: #203a5a; font-size: 13px; }
        .hw-statistics-topbar span { color: #7a8ba0; font-size: 11px; }
        .hw-statistics-body { min-width: 0; padding: 0; }
        .hw-statistics-body > * { max-width: 100%; }
        .hw-back-link { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 10px 13px; border: 1px solid #dce5f0; border-radius: 10px; background: #fff; color: #3c5877; font-size: 12px; font-weight: 800; cursor: pointer; }
        .hw-back-link:hover { border-color: #bcd0f0; background: #f8fbff; }
        .hw-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8f1; }
        .hw-footer-brand { color: #526b86; font-size: 11px; font-weight: 900; letter-spacing: .9px; }
        .hw-footer-brand span { margin-right: 7px; color: #3478f6; font-size: 16px; }
        .hw-footer-note { color: #8a99ab; font-size: 10px; line-height: 1.7; }
        .hw-dashboard button:focus-visible { outline: 3px solid rgba(52,120,246,.3); outline-offset: 3px; }
        @media (max-width: 760px) {
          .hw-shell { padding: 20px 15px; }
          .hw-hero { grid-template-columns: minmax(0, 1fr); padding: 30px 25px; }
          .hw-hero-art { min-height: 160px; }
          .hw-art-ring { width: 160px; height: 160px; }
          .hw-art-ring-inner { width: 120px; height: 120px; }
          .hw-art-symbol { width: 88px; height: 88px; border-radius: 24px; }
          .hw-admin-grid { grid-template-columns: minmax(0, 1fr); }
          .hw-section-title { font-size: 23px; }
          .hw-page-banner { padding: 25px; }
        }
        @media (max-width: 440px) {
          .hw-brand-title { font-size: 18px; }
          .hw-brand-subtitle { font-size: 8px; letter-spacing: 1px; }
          .hw-header-actions { width: 100%; }
          .hw-user-pill { flex: 1; min-width: 0; }
          .hw-hero { padding: 25px 20px; }
          .hw-hero h1 { font-size: 31px; }
          .hw-admin-card { flex-wrap: wrap; padding: 19px; }
          .hw-admin-icon { width: 49px; height: 49px; }
          .hw-module-card { padding: 18px; }
          .hw-footer { justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hw-dashboard *, .hw-dashboard *::before, .hw-dashboard *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="hw-shell">
        {actingAs && (
          <section className="hw-impersonation">
            <div>
              <strong>Administrator view</strong>
              <p>Viewing the workspace as {displayName}</p>
            </div>
            <button
              type="button"
              className="hw-btn"
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </button>
          </section>
        )}

        <header className="hw-header">
          <div className="hw-brand">
            <div className="hw-brand-logo" aria-hidden="true">✚</div>
            <div>
              <div className="hw-brand-title">
                HOSPITAL <span>WORKFLOW</span>
              </div>
              <div className="hw-brand-subtitle">
                REHABILITATION MANAGEMENT
              </div>
            </div>
          </div>

          <div className="hw-header-actions">
            <div className="hw-user-pill">
              <span className="hw-avatar" aria-hidden="true">♙</span>
              <span>{displayName}</span>
            </div>
            <button
              type="button"
              className="hw-btn hw-btn-danger"
              onClick={onLogout}
            >
              ↪ Logout
            </button>
          </div>
        </header>

        {view === "home" && (
          <>
            <section className="hw-hero">
              <div className="hw-hero-content">
                <div className="hw-eyebrow">
                  <span className="hw-eyebrow-dot" />
                  MANAGEMENT WORKSPACE
                </div>
                <h1>
                  Welcome back,
                  <br />
                  <span>{displayName}</span>
                </h1>
                <p>
                  Your rehabilitation management workspace for department
                  administration, staff coordination, performance monitoring,
                  and patient-centered care.
                </p>
                <div className="hw-hero-note">
                  <span>✓</span>
                  Organized management. Better care.
                </div>
              </div>
              <div className="hw-hero-art" aria-hidden="true">
                <div className="hw-art-ring" />
                <div className="hw-art-ring-inner" />
                <div className="hw-art-symbol">✚</div>
              </div>
            </section>

            <section className="hw-section">
              <div className="hw-section-header">
                <div>
                  <div className="hw-section-label">WORKSPACE</div>
                  <h2 className="hw-section-title">Administration</h2>
                  <p className="hw-section-description">
                    Open the management workspace to access department
                    statistics, evaluation tracking, staff performance,
                    leave management, and user administration.
                  </p>
                </div>
                <div className="hw-section-tag">SYSTEM MANAGEMENT</div>
              </div>

              <button
                type="button"
                className="hw-admin-card"
                onClick={openAdministration}
                aria-label="Open Administration Dashboard"
              >
                <div className="hw-admin-icon" aria-hidden="true">▦</div>
                <div className="hw-admin-content">
                  <div className="hw-admin-kicker">MANAGEMENT CENTER</div>
                  <h3 className="hw-admin-title">
                    Administration Dashboard
                  </h3>
                  <p className="hw-admin-description">
                    Access all management modules from one organized page.
                    Select a section to open it in your application.
                  </p>
                  <span className="hw-admin-action">
                    Open Administration
                    <span className="hw-admin-arrow">→</span>
                  </span>
                </div>
              </button>

              <div className="hw-info">
                <strong>ⓘ</strong>
                <span>
                  Select Administration to access the management modules.
                </span>
              </div>
            </section>

            <section className="hw-tip">
              <div className="hw-tip-header">
                <div className="hw-tip-heading-wrap">
                  <div className="hw-tip-icon">♙</div>
                  <div>
                    <div className="hw-tip-kicker">
                      LEADERSHIP &amp; MANAGEMENT
                    </div>
                    <h2 className="hw-tip-heading">
                      Daily Management Tip
                    </h2>
                  </div>
                </div>
                <div className="hw-tip-badge">DAILY INSIGHT</div>
              </div>

              <div className="hw-tip-body">
                <div className="hw-tip-category">
                  {dailyMessage.category}
                </div>
                <h3 className="hw-tip-title">{dailyMessage.title}</h3>
                <p className="hw-tip-message">{dailyMessage.message}</p>
              </div>

              <div className="hw-tip-footer">
                <span>✦</span>
                Lead with fairness. Communicate clearly. Improve together.
              </div>
            </section>
          </>
        )}

        {view === "administration" && (
          <main className="hw-admin-page">
            <section className="hw-page-banner">
              <div className="hw-page-banner-content">
                <div className="hw-page-banner-kicker">
                  HOSPITAL WORKFLOW / MANAGEMENT
                </div>
                <h1>Administration Dashboard</h1>
                <p>
                  Welcome, {displayName}. Choose a management module below.
                </p>
              </div>
              <button type="button" className="hw-btn" onClick={goHome}>
                ← Back to Home
              </button>
            </section>

            <section className="hw-section">
              <div className="hw-section-header">
                <div>
                  <div className="hw-section-label">MANAGEMENT MODULES</div>
                  <h2 className="hw-section-title">
                    Select a department tool
                  </h2>
                  <p className="hw-section-description">
                    Select a card to open its module.
                  </p>
                </div>
                <div className="hw-section-tag">
                  {menuItems.length} MODULES
                </div>
              </div>

              <div className="hw-admin-grid">
                {menuItems.map((item) => (
                  <button
                    key={item.action || item.path}
                    type="button"
                    className="hw-module-card"
                    onClick={() => handleMenuItem(item)}
                  >
                    <div
                      className={`hw-module-icon ${item.color}`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </div>
                    <div className="hw-module-content">
                      <h2>{item.label}</h2>
                      <p>{item.description}</p>
                      <span className="hw-module-open">
                        Open section <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="hw-admin-note">
                <div className="hw-admin-note-icon">ⓘ</div>
                <div>
                  <strong>Navigation note</strong>
                  <br />
                  Rehabilitation Statistics opens the statistics component
                  inside this Administration section. The other cards
                  continue to use their configured routes.
                </div>
              </div>
            </section>
          </main>
        )}

        {view === "statistics" && (
          <main className="hw-admin-page">
            <button
              type="button"
              className="hw-back-link"
              onClick={() => setView("administration")}
            >
              ← Back to Administration
            </button>

            <section className="hw-page-banner">
              <div className="hw-page-banner-content">
                <div className="hw-page-banner-kicker">
                  REHABILITATION / REPORTING
                </div>
                <h1>Rehabilitation Statistics</h1>
                <p>
                  Monitor daily and monthly registrations, therapist activity,
                  and department totals.
                </p>
              </div>
              <button type="button" className="hw-btn" onClick={goHome}>
                ← Back to Home
              </button>
            </section>

            <div className="hw-statistics-wrapper">
              <div className="hw-statistics-topbar">
                <strong>Physiotherapy Statistics</strong>
                <span>Live data from the assignments API</span>
              </div>

              <div className="hw-statistics-body">
                <Suspense
                  fallback={
                    <div style={{ padding: 30, textAlign: "center" }}>
                      Loading rehabilitation statistics…
                    </div>
                  }
                >
                  <AdminStatisticsSection />
                </Suspense>
              </div>
            </div>
          </main>
        )}

        <footer className="hw-footer">
          <div className="hw-footer-brand">
            <span>✚</span>
            HOSPITAL WORKFLOW
          </div>
          <div className="hw-footer-note">
            Rehabilitation Management · Organized management. Better care.
          </div>
        </footer>
      </div>
    </div>
  );
}
