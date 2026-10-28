import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

ASSETS_DIR = "teacher_diagram_assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. MATPLOTLIB SEQUENCE DIAGRAM DRAWING ENGINE
# -------------------------------------------------------------
def draw_sequence_diagram(filename, title, participants, steps, fig_height=6.5):
    """
    Renders an executive-grade UML sequence diagram with participants, lifelines,
    and numbered request/response arrows.
    """
    fig, ax = plt.subplots(figsize=(10, fig_height), dpi=220)
    ax.set_facecolor('#0F172A')
    fig.patch.set_facecolor('#0F172A')
    
    num_p = len(participants)
    x_coords = {p['id']: (i + 0.6) * (10.0 / (num_p + 0.2)) for i, p in enumerate(participants)}
    
    # Title banner at top
    ax.text(5.0, fig_height - 0.35, title, color='#F8FAFC', fontsize=12.5, fontweight='bold',
            ha='center', va='center', family='sans-serif')
    
    header_y = fig_height - 0.95
    bottom_y = 0.5
    
    # Draw Participant boxes & Lifelines
    for p in participants:
        x = x_coords[p['id']]
        box_w = 1.35
        box_h = 0.45
        
        # Participant Box
        rect = patches.FancyBboxPatch(
            (x - box_w/2, header_y - box_h/2), box_w, box_h,
            boxstyle="round,pad=0.08,rounding_size=0.1",
            facecolor=p.get('color', '#334155'),
            edgecolor=p.get('border', '#64748B'),
            linewidth=1.5
        )
        ax.add_patch(rect)
        ax.text(x, header_y, p['name'], color='#FFFFFF', fontsize=8.5, fontweight='bold',
                ha='center', va='center', family='sans-serif')
        
        # Vertical Lifeline
        ax.plot([x, x], [header_y - box_h/2, bottom_y], color='#334155', linestyle='--', linewidth=1.2, zorder=1)
        
        # Bottom anchor box
        rect_bot = patches.FancyBboxPatch(
            (x - box_w/2, bottom_y - box_h/2), box_w, box_h,
            boxstyle="round,pad=0.08,rounding_size=0.1",
            facecolor=p.get('color', '#334155'),
            edgecolor=p.get('border', '#64748B'),
            linewidth=1.2
        )
        ax.add_patch(rect_bot)
        ax.text(x, bottom_y, p['name'], color='#94A3B8', fontsize=7.5, fontweight='bold',
                ha='center', va='center', family='sans-serif')

    # Draw Steps
    y_step_gap = (header_y - 0.55 - bottom_y) / (len(steps) + 0.5)
    
    for i, s in enumerate(steps):
        curr_y = (header_y - 0.55) - (i + 0.6) * y_step_gap
        x_from = x_coords[s['from']]
        x_to = x_coords[s['to']]
        is_return = s.get('is_return', False)
        step_color = s.get('color', '#38BDF8' if not is_return else '#34D399')
        
        # Arrow line
        line_style = '--' if is_return else '-'
        head_w = 0.12
        head_l = 0.14
        
        direction = 1 if x_to > x_from else -1
        ax.annotate(
            '',
            xy=(x_to - direction * 0.05, curr_y),
            xytext=(x_from + direction * 0.05, curr_y),
            arrowprops=dict(
                arrowstyle='->',
                color=step_color,
                lw=1.5,
                linestyle=line_style,
                shrinkA=0, shrinkB=0
            ),
            zorder=3
        )
        
        # Label with pill badge
        label_text = f"{i+1}. {s['label']}"
        mid_x = (x_from + x_to) / 2.0
        
        # Small background badge for label text
        ax.text(
            mid_x, curr_y + 0.14, label_text,
            color='#F1F5F9', fontsize=7.8, fontweight='bold',
            ha='center', va='bottom', family='sans-serif',
            bbox=dict(boxstyle='round,pad=0.2', facecolor='#1E293B', edgecolor=step_color, lw=0.8, alpha=0.95),
            zorder=4
        )
    
    ax.set_xlim(0, 10.0)
    ax.set_ylim(0, fig_height)
    ax.axis('off')
    
    plt.tight_layout()
    output_path = os.path.join(ASSETS_DIR, filename)
    plt.savefig(output_path, dpi=240, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    return output_path


# -------------------------------------------------------------
# 2. GENERATE ALL 7 DIAGRAMS
# -------------------------------------------------------------
print("Rendering Diagram 1: Overall System Architecture...")
# Architecture Block Diagram
def draw_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.2), dpi=220)
    ax.set_facecolor('#0F172A')
    fig.patch.set_facecolor('#0F172A')
    
    ax.text(5.0, 4.85, "AllianceEC— Teacher Portal Full Architecture Map", color='#F8FAFC',
            fontsize=13, fontweight='bold', ha='center', va='center')
    
    # Layer 1: Teacher Client Layer
    rect_c = patches.FancyBboxPatch((0.5, 3.2), 9.0, 1.25, boxstyle="round,pad=0.1",
                                   facecolor='#1E293B', edgecolor='#6366F1', lw=1.8)
    ax.add_patch(rect_c)
    ax.text(0.7, 4.15, "TEACHER FRONT-END CLIENT MODULES (React TS / Vite & Mobile React Native)", color='#818CF8', fontsize=9, fontweight='bold')
    
    ui_mods = [
        ("Dashboard & Stats", 0.7, "#4F46E5"),
        ("Course Wizard", 2.2, "#0D9488"),
        ("Classroom Mgr", 3.7, "#0284C7"),
        ("MCQ Builder", 5.2, "#D97706"),
        ("Exam Audit", 6.7, "#E11D48"),
        ("Royalty Payouts", 8.2, "#7C3AED")
    ]
    for name, x, c in ui_mods:
        r = patches.FancyBboxPatch((x, 3.35), 1.25, 0.65, boxstyle="round,pad=0.08", facecolor=c, edgecolor='#FFFFFF', lw=0.8)
        ax.add_patch(r)
        ax.text(x + 0.625, 3.675, name, color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center')

    # Layer 2: API & Gateway Layer
    rect_g = patches.FancyBboxPatch((0.5, 1.7), 9.0, 1.1, boxstyle="round,pad=0.1",
                                   facecolor='#1E293B', edgecolor='#10B981', lw=1.8)
    ax.add_patch(rect_g)
    ax.text(0.7, 2.55, "REST API GATEWAY & RBAC SECURITY MIDDLEWARE", color='#34D399', fontsize=9, fontweight='bold')
    
    gw_mods = [
        ("JWT Auth & Role Guard\n(TEACHER, ADMIN)", 1.2, "#065F46"),
        ("TeacherController\n(/stats, /courses, /mcqs)", 4.0, "#047857"),
        ("Upload Middleware\n(Cloudinary & Multer)", 7.0, "#059669")
    ]
    for name, x, c in gw_mods:
        r = patches.FancyBboxPatch((x, 1.85), 2.2, 0.6, boxstyle="round,pad=0.08", facecolor=c, edgecolor='#A7F3D0', lw=0.8)
        ax.add_patch(r)
        ax.text(x + 1.1, 2.15, name, color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center')

    # Layer 3: Persistence Layer
    rect_d = patches.FancyBboxPatch((0.5, 0.2), 9.0, 1.1, boxstyle="round,pad=0.1",
                                   facecolor='#1E293B', edgecolor='#F59E0B', lw=1.8)
    ax.add_patch(rect_d)
    ax.text(0.7, 1.05, "DATABASE PERSISTENCE & MEDIA STORAGE", color='#FBBF24', fontsize=9, fontweight='bold')
    
    db_mods = [
        ("Course Collection\n(Taxonomy, Materials, Tests)", 0.8, "#B45309"),
        ("McqQuestion Collection\n(Question Bank & Keys)", 3.4, "#92400E"),
        ("McqAttempt Collection\n(Student Scorecards)", 5.7, "#78350F"),
        ("Cloudinary Cloud\n(Thumbnails & Docs)", 7.8, "#451A03")
    ]
    for name, x, c in db_mods:
        r = patches.FancyBboxPatch((x, 0.35), 1.7, 0.6, boxstyle="round,pad=0.08", facecolor=c, edgecolor='#FDE68A', lw=0.8)
        ax.add_patch(r)
        ax.text(x + 0.85, 0.65, name, color='#FFFFFF', fontsize=7.2, fontweight='bold', ha='center', va='center')

    # Connecting arrows between layers
    for cx in [2.0, 5.0, 8.0]:
        ax.annotate('', xy=(cx, 2.8), xytext=(cx, 3.2), arrowprops=dict(arrowstyle="<->", color="#94A3B8", lw=1.5))
        ax.annotate('', xy=(cx, 1.3), xytext=(cx, 1.7), arrowprops=dict(arrowstyle="<->", color="#94A3B8", lw=1.5))

    ax.set_xlim(0, 10.0)
    ax.set_ylim(0, 5.2)
    ax.axis('off')
    plt.tight_layout()
    path = os.path.join(ASSETS_DIR, "diag0_architecture.png")
    plt.savefig(path, dpi=240, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    return path

diag0_path = draw_architecture_diagram()

# Diagram 1: Auth & Dashboard
p_auth = [
    {'id': 'tea', 'name': 'Teacher (Educator)', 'color': '#4F46E5', 'border': '#818CF8'},
    {'id': 'ui', 'name': 'Teacher Portal UI', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'jwt', 'name': 'JWT RBAC Guard', 'color': '#0D9488', 'border': '#2DD4BF'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'db', 'name': 'MongoDB Atlas', 'color': '#D97706', 'border': '#FBBF24'},
]
steps_auth = [
    {'from': 'tea', 'to': 'ui', 'label': 'Login with Educator Credentials'},
    {'from': 'ui', 'to': 'jwt', 'label': 'GET /api/teacher/stats (Bearer Token)'},
    {'from': 'jwt', 'to': 'jwt', 'label': 'Verify JWT Signature & Role === TEACHER'},
    {'from': 'jwt', 'to': 'ctrl', 'label': 'Invoke getTeacherStats(req, res)'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Count courses where instructor = teacherId'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Aggregate total enrolled students & revenue'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Return aggregated metrics data', 'is_return': True},
    {'from': 'ctrl', 'to': 'ui', 'label': 'HTTP 200 { success: true, stats: {...} }', 'is_return': True},
    {'from': 'ui', 'to': 'tea', 'label': 'Render Real-time KPI Metric Cards', 'is_return': True}
]
print("Rendering Diagram 2: Auth & Metrics...")
diag1_path = draw_sequence_diagram("diag1_auth_metrics.png", "Module 1: Teacher Authentication & Real-Time Metrics Sequence", p_auth, steps_auth)

# Diagram 2: Course Creation Wizard
p_course = [
    {'id': 'tea', 'name': 'Teacher', 'color': '#4F46E5', 'border': '#818CF8'},
    {'id': 'wiz', 'name': 'Wizard Modal UI', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'cld', 'name': 'Cloudinary CDN', 'color': '#7C3AED', 'border': '#A78BFA'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'db', 'name': 'Course Database', 'color': '#D97706', 'border': '#FBBF24'},
    {'id': 'cat', 'name': 'Student Catalog', 'color': '#E11D48', 'border': '#FB7185'},
]
steps_course = [
    {'from': 'tea', 'to': 'wiz', 'label': 'Step 1: Choose Category, Board, Grade & State'},
    {'from': 'tea', 'to': 'wiz', 'label': 'Step 2: Set MRP, Offer Price, Live Timing & Demo Video'},
    {'from': 'tea', 'to': 'wiz', 'label': 'Step 3: Attach Study Materials & Topic Mock Tests'},
    {'from': 'wiz', 'to': 'cld', 'label': 'Upload Banner Image (Multer Stream)'},
    {'from': 'cld', 'to': 'wiz', 'label': 'Return Secure Thumbnail CDN URL', 'is_return': True},
    {'from': 'wiz', 'to': 'ctrl', 'label': 'POST /api/teacher/courses (Complete JSON Payload)'},
    {'from': 'ctrl', 'to': 'ctrl', 'label': 'Validate sub-arrays, sanitize & generate slug'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Course.create({ ...courseData, instructor: teacherId })'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Course Record Saved & Indexed', 'is_return': True},
    {'from': 'ctrl', 'to': 'wiz', 'label': 'HTTP 201 Created { success: true, course }', 'is_return': True},
    {'from': 'db', 'to': 'cat', 'label': 'Auto-Published to Student Platform Batches', 'is_return': True}
]
print("Rendering Diagram 3: Course Creation Wizard...")
diag2_path = draw_sequence_diagram("diag2_course_wizard.png", "Module 2: 3-Step Course Creation Wizard & Auto-Publish Sequence", p_course, steps_course)

# Diagram 3: Classroom Management
p_class = [
    {'id': 'tea', 'name': 'Teacher', 'color': '#4F46E5', 'border': '#818CF8'},
    {'id': 'ui', 'name': 'Classroom UI', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'db', 'name': 'MongoDB Atlas', 'color': '#D97706', 'border': '#FBBF24'},
    {'id': 'meet', 'name': 'Google Meet / Zoom', 'color': '#059669', 'border': '#34D399'},
]
steps_class = [
    {'from': 'tea', 'to': 'ui', 'label': 'Open "My Courses & Batches" Tab'},
    {'from': 'ui', 'to': 'ctrl', 'label': 'GET /api/teacher/courses'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Query courses by instructor ID'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Return course array with materials & test counts', 'is_return': True},
    {'from': 'ctrl', 'to': 'ui', 'label': 'Render Course Cards with Deliverable Pills', 'is_return': True},
    {'from': 'tea', 'to': 'ui', 'label': 'Click "Inspect Enrolled Students"'},
    {'from': 'ui', 'to': 'ctrl', 'label': 'GET /api/teacher/courses/:id/students'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Find enrolled students & payment verification'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Return Student Profiles (Name, Mobile, State)', 'is_return': True},
    {'from': 'ctrl', 'to': 'ui', 'label': 'Display Student Enrollment Table', 'is_return': True},
    {'from': 'tea', 'to': 'meet', 'label': 'Click "Start Live Class" -> Launch Meeting Link'}
]
print("Rendering Diagram 4: Classroom Management...")
diag3_path = draw_sequence_diagram("diag3_classroom.png", "Module 3: Classroom Management & Enrolled Students Tracking Sequence", p_class, steps_class)

# Diagram 4: MCQ Quiz Builder
p_mcq = [
    {'id': 'tea', 'name': 'Teacher', 'color': '#4F46E5', 'border': '#818CF8'},
    {'id': 'ui', 'name': 'MCQ Builder UI', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'db', 'name': 'McqQuestion DB', 'color': '#D97706', 'border': '#FBBF24'},
    {'id': 'stu', 'name': 'Student Quiz Engine', 'color': '#E11D48', 'border': '#FB7185'},
]
steps_mcq = [
    {'from': 'tea', 'to': 'ui', 'label': 'Select Subject, Grade, Target State & Quiz Set Title'},
    {'from': 'tea', 'to': 'ui', 'label': 'Input Question Text, 4 Options, Correct Option & Solution'},
    {'from': 'tea', 'to': 'ui', 'label': 'Click "Save Question to Bank"'},
    {'from': 'ui', 'to': 'ctrl', 'label': 'POST /api/teacher/mcqs (Payload + Auth Token)'},
    {'from': 'ctrl', 'to': 'ctrl', 'label': 'Validate Options count === 4 & correctOption bounds'},
    {'from': 'ctrl', 'to': 'db', 'label': 'McqQuestion.create({ ...data, educator: teacherId })'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Question Stored in Central Question Vault', 'is_return': True},
    {'from': 'ctrl', 'to': 'ui', 'label': 'HTTP 201 Created { success: true, mcq }', 'is_return': True},
    {'from': 'ui', 'to': 'tea', 'label': 'Displays in Active Question Bank List', 'is_return': True},
    {'from': 'db', 'to': 'stu', 'label': 'Live Available for Student Practice Assessments', 'is_return': True}
]
print("Rendering Diagram 5: MCQ Builder...")
diag4_path = draw_sequence_diagram("diag4_mcq_builder.png", "Module 4: Topic-Wise MCQ Quiz Builder & Set Creation Sequence", p_mcq, steps_mcq)

# Diagram 5: Exam Audit & Analytics
p_audit = [
    {'id': 'stu', 'name': 'Student Learner', 'color': '#E11D48', 'border': '#FB7185'},
    {'id': 'eng', 'name': 'Quiz Engine', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'db', 'name': 'McqAttempt DB', 'color': '#D97706', 'border': '#FBBF24'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'tea', 'name': 'Teacher', 'color': '#4F46E5', 'border': '#818CF8'},
]
steps_audit = [
    {'from': 'stu', 'to': 'eng', 'label': 'Submit Quiz Answers with selected options'},
    {'from': 'eng', 'to': 'eng', 'label': 'Evaluate score, accuracy % & pass/fail threshold'},
    {'from': 'eng', 'to': 'db', 'label': 'Save McqAttempt (score, marks, studentId, time)'},
    {'from': 'tea', 'to': 'ctrl', 'label': 'Open "MCQ Audit & Attempt Reports" Tab'},
    {'from': 'ctrl', 'to': 'db', 'label': 'GET /api/teacher/mcq-attempts (Filter by educator batch)'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Return attempts list populated with student details', 'is_return': True},
    {'from': 'ctrl', 'to': 'tea', 'label': 'HTTP 200 { attempts: [...] }', 'is_return': True},
    {'from': 'tea', 'to': 'tea', 'label': 'Evaluate Class Scorecards, Pass Rates & Top Performers'}
]
print("Rendering Diagram 6: Exam Audit...")
diag5_path = draw_sequence_diagram("diag5_audit.png", "Module 5: Student Exam Audit & Analytics Sequence", p_audit, steps_audit)

# Diagram 6: Royalty Payouts
p_pay = [
    {'id': 'tea', 'name': 'Teacher', 'color': '#4F46E5', 'border': '#818CF8'},
    {'id': 'ui', 'name': 'Payout UI', 'color': '#0284C7', 'border': '#38BDF8'},
    {'id': 'ctrl', 'name': 'Teacher Controller', 'color': '#16A34A', 'border': '#4ADE80'},
    {'id': 'db', 'name': 'MongoDB Atlas', 'color': '#D97706', 'border': '#FBBF24'},
    {'id': 'adm', 'name': 'Super Admin', 'color': '#E11D48', 'border': '#FB7185'},
]
steps_pay = [
    {'from': 'tea', 'to': 'ui', 'label': 'Check Accumulated Course Sales Royalty Balance'},
    {'from': 'ui', 'to': 'ctrl', 'label': 'GET /api/teacher/stats (Check wallet/earnings)'},
    {'from': 'ctrl', 'to': 'ui', 'label': 'Return Available Withdrawable Royalty: Rs. XX,XXX', 'is_return': True},
    {'from': 'tea', 'to': 'ui', 'label': 'Enter Payout Amount + Bank Account / UPI ID'},
    {'from': 'ui', 'to': 'ctrl', 'label': 'POST /api/teacher/payouts/request'},
    {'from': 'ctrl', 'to': 'db', 'label': 'Verify balance >= amount & create PayoutRequest (PENDING)'},
    {'from': 'db', 'to': 'ctrl', 'label': 'Payout Request Logged with Ref ID', 'is_return': True},
    {'from': 'ctrl', 'to': 'ui', 'label': 'HTTP 200 "Payout Request Submitted Successfully"', 'is_return': True},
    {'from': 'adm', 'to': 'db', 'label': 'Admin Reviews & Approves Bank Transfer'},
    {'from': 'db', 'to': 'ui', 'label': 'Status updated to COMPLETED in Teacher Ledger', 'is_return': True}
]
print("Rendering Diagram 7: Royalty Payouts...")
diag6_path = draw_sequence_diagram("diag6_payouts.png", "Module 6: Teacher Royalty Earnings & Payout Withdrawal Sequence", p_pay, steps_pay)


# -------------------------------------------------------------
# 3. BUILD EXECUTIVE PDF WITH REPORTLAB
# -------------------------------------------------------------
print("Compiling Executive PDF Specification...")
PDF_FILENAME = "TEACHER_MODULES_SEQUENCE_DIAGRAMS_SPECIFICATION.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page
        
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header
        self.drawString(40, 805, "AllianceEC— TEACHER MODULES ARCHITECTURE & SEQUENCE SPECIFICATION")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.6)
        self.line(40, 798, 555, 798)
        
        # Footer
        self.setFont("Helvetica", 8)
        self.drawString(40, 25, "Confidential — Official Enterprise Technical Documentation")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(555, 25, page_str)
        self.line(40, 35, 555, 35)
        self.restoreState()

doc = SimpleDocTemplate(
    PDF_FILENAME,
    pagesize=A4,
    leftMargin=40,
    rightMargin=40,
    topMargin=50,
    bottomMargin=50
)

styles = getSampleStyleSheet()

# Custom typography styles
title_style = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=26,
    leading=32,
    textColor=colors.HexColor('#0F172A'),
    alignment=1,
    spaceAfter=12
)

subtitle_style = ParagraphStyle(
    'CoverSubTitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=13,
    leading=18,
    textColor=colors.HexColor('#475569'),
    alignment=1,
    spaceAfter=24
)

h1_style = ParagraphStyle(
    'SecH1',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=20,
    textColor=colors.HexColor('#0F172A'),
    spaceBefore=8,
    spaceAfter=6
)

body_style = ParagraphStyle(
    'SecBody',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13.5,
    textColor=colors.HexColor('#334155'),
    spaceAfter=8
)

badge_style = ParagraphStyle(
    'SecBadge',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor('#4F46E5')
)

story = []

# =============================================================
# PAGE 1: COVER PAGE
# =============================================================
story.append(Spacer(1, 40))
story.append(Paragraph("AllianceEC", ParagraphStyle('Org', fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#F59E0B'), alignment=1, spaceAfter=8)))
story.append(Paragraph("TEACHER & EDUCATOR MODULES", title_style))
story.append(Paragraph("Complete Technical Architecture & Sequence Diagrams Specification", subtitle_style))
story.append(HRFlowable(width="60%", thickness=2, color=colors.HexColor('#6366F1'), spaceBefore=10, spaceAfter=30))

meta_data = [
    [Paragraph("<b>Document Version:</b>", body_style), Paragraph("v2.4.0 (Enterprise Production)", body_style)],
    [Paragraph("<b>Target Platform:</b>", body_style), Paragraph("Web (React/Vite) & Mobile (Android APK/AAB)", body_style)],
    [Paragraph("<b>Backend API:</b>", body_style), Paragraph("Node.js / Express / MongoDB (Render Deployment)", body_style)],
    [Paragraph("<b>Production API URL:</b>", body_style), Paragraph("https://e-learning-63yb.onrender.com/api", body_style)],
    [Paragraph("<b>Modules Covered:</b>", body_style), Paragraph("Dashboard, Course Wizard, Classroom, MCQ Builder, Audit, Payouts", body_style)],
    [Paragraph("<b>Author / Architecture:</b>", body_style), Paragraph("Google DeepMind Agentic Pair Programming", body_style)],
]
meta_table = Table(meta_data, colWidths=[160, 310])
meta_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
    ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
    ('RIGHTPADDING', (0,0), (-1,-1), 12),
]))
story.append(meta_table)

story.append(Spacer(1, 40))
story.append(Paragraph("<b>Table of Contents:</b>", ParagraphStyle('TOCHead', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor('#0F172A'), spaceAfter=8)))
toc_items = [
    "1. High-Level Teacher System Architecture & Component Mapping",
    "2. Module 1: Teacher Authentication & Real-Time Metrics Sequence",
    "3. Module 2: 3-Step Course Creation Wizard & Auto-Publish Sequence",
    "4. Module 3: Classroom Management & Enrolled Students Tracking Sequence",
    "5. Module 4: Topic-Wise MCQ Quiz Builder & Set Creation Sequence",
    "6. Module 5: Student Exam Audit & Analytics Sequence",
    "7. Module 6: Royalty Earnings & Payout Withdrawal Request Sequence"
]
for item in toc_items:
    story.append(Paragraph(f"• &nbsp; {item}", ParagraphStyle('TOCItem', fontName='Helvetica', fontSize=9, leading=14, textColor=colors.HexColor('#475569'))))

story.append(PageBreak())

# =============================================================
# HELPER: SECTION BUILDER
# =============================================================
def add_module_section(mod_num, title, badge, desc, img_path, steps_data, img_w=515, img_h=230):
    story.append(Paragraph(badge, badge_style))
    story.append(Paragraph(title, h1_style))
    story.append(Paragraph(desc, body_style))
    story.append(Spacer(1, 4))
    
    # Diagram Image
    story.append(Image(img_path, width=img_w, height=img_h))
    story.append(Spacer(1, 8))
    
    # Steps Breakdown Table
    story.append(Paragraph("<b>Sequence Execution Steps & Data Exchange:</b>", ParagraphStyle('StepsH', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0F172A'), spaceAfter=4)))
    
    table_rows = [
        [
            Paragraph("<b>#</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#1E293B'))),
            Paragraph("<b>Sender</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#1E293B'))),
            Paragraph("<b>Receiver</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#1E293B'))),
            Paragraph("<b>Action / Payload Description</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#1E293B'))),
            Paragraph("<b>DB / System Impact</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#1E293B')))
        ]
    ]
    
    for row in steps_data:
        table_rows.append([
            Paragraph(str(row[0]), ParagraphStyle('TD', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#4F46E5'))),
            Paragraph(row[1], ParagraphStyle('TD', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#0F172A'))),
            Paragraph(row[2], ParagraphStyle('TD', fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor('#0F172A'))),
            Paragraph(row[3], ParagraphStyle('TD', fontName='Helvetica', fontSize=7.2, leading=10, textColor=colors.HexColor('#334155'))),
            Paragraph(row[4], ParagraphStyle('TD', fontName='Helvetica', fontSize=7.2, leading=10, textColor=colors.HexColor('#475569')))
        ])
        
    st_table = Table(table_rows, colWidths=[20, 80, 80, 205, 130])
    st_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.4, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(st_table)
    story.append(PageBreak())

# =============================================================
# PAGE 2: ARCHITECTURE OVERVIEW
# =============================================================
story.append(Paragraph("SYSTEM ARCHITECTURE OVERVIEW", badge_style))
story.append(Paragraph("High-Level Teacher System Component Mapping", h1_style))
story.append(Paragraph(
    "The AllianceECTeacher ecosystem comprises three tightly integrated architectural layers: "
    "<b>(1) Educator Client Layer</b> (Web SPA & React Native Mobile App), "
    "<b>(2) REST Gateway & Security Layer</b> (Express router guarded by JWT Authentication and Role-Based Access Control enforcing role <code>TEACHER</code> or <code>ADMIN</code>), and "
    "<b>(3) Persistence & Cloud Vault</b> (MongoDB schemas for Courses, McqQuestions, McqAttempts, and PayoutRequests alongside Cloudinary for multimedia storage).",
    body_style
))
story.append(Spacer(1, 4))
story.append(Image(diag0_path, width=515, height=240))
story.append(Spacer(1, 14))

arch_summary = [
    [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Tech Stack & Role</b>", body_style), Paragraph("<b>Security / Policies</b>", body_style)],
    [Paragraph("Teacher Web Portal", body_style), Paragraph("React 18 + Vite, Tailwind/Vanilla CSS, Lucide icons", body_style), Paragraph("Protected routes, auto-refresh JWT interceptor", body_style)],
    [Paragraph("Teacher Mobile APK", body_style), Paragraph("React Native 0.87, Android Native bundle, Metro", body_style), Paragraph("AsyncStorage secure token vault, deep-links", body_style)],
    [Paragraph("API Gateway", body_style), Paragraph("Node.js / Express.js on Render Cloud", body_style), Paragraph("CORS allowlist, Helmet, Rate-limiting", body_style)],
    [Paragraph("Teacher Controller", body_style), Paragraph("teacherController.js (CRUD, aggregates, payout logic)", body_style), Paragraph("Strict RBAC guard: restrictTo('TEACHER','ADMIN')", body_style)],
    [Paragraph("MongoDB Database", body_style), Paragraph("MongoDB Atlas (Mongoose ODM schemas)", body_style), Paragraph("Compound indexes on category, stateCode, active", body_style)]
]
t_arch = Table(arch_summary, colWidths=[120, 220, 175])
t_arch.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
    ('BOX', (0,0), (-1,-1), 0.8, colors.HexColor('#CBD5E1')),
    ('INNERGRID', (0,0), (-1,-1), 0.4, colors.HexColor('#E2E8F0')),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
]))
story.append(t_arch)
story.append(PageBreak())

# =============================================================
# PAGE 3: MODULE 1 (AUTH & STATS)
# =============================================================
steps_data_1 = [
    [1, "Teacher", "Portal UI", "Submits login credentials (email & password)", "Client initiates Auth token exchange"],
    [2, "Portal UI", "RBAC Guard", "Dispatches GET /api/teacher/stats with Bearer JWT", "Transported over HTTPS SSL"],
    [3, "RBAC Guard", "RBAC Guard", "Validates JWT signature, expiration & role === 'TEACHER'", "Rejects with 401/403 if invalid"],
    [4, "RBAC Guard", "TeacherCtrl", "Forwards verified request to getTeacherStats handler", "Attaches req.user payload"],
    [5, "TeacherCtrl", "MongoDB", "Executes Course.countDocuments({ instructor: teacherId })", "Queries active published batches"],
    [6, "TeacherCtrl", "MongoDB", "Aggregates enrolled student enrollments and sum of revenues", "Calculates net royalty balance"],
    [7, "MongoDB", "TeacherCtrl", "Returns aggregated KPI metrics to controller", "Low-latency Indexed lookup"],
    [8, "TeacherCtrl", "Portal UI", "Returns HTTP 200 { success: true, stats: {...} }", "Populates dashboard state"],
    [9, "Portal UI", "Teacher", "Renders Active Batches, Enrolled Learners & Revenue Cards", "Real-time reactive visual update"]
]
add_module_section(
    1,
    "Module 1: Teacher Authentication & Real-Time Metrics Sequence",
    "MODULE 1 SPECIFICATION",
    "Upon educator authentication, the portal dispatches an authenticated query to the stats controller. "
    "The backend performs non-blocking aggregation over the Course and Enrollment collections, extracting "
    "the total courses authored by the educator, total active enrolled learners, accumulated earnings, and "
    "live question bank stats.",
    diag1_path,
    steps_data_1,
    515, 230
)

# =============================================================
# PAGE 4: MODULE 2 (COURSE WIZARD)
# =============================================================
steps_data_2 = [
    [1, "Teacher", "Wizard Modal", "Step 1: Selects Category, Grade, Board, Subject & State", "Client validates taxonomy node"],
    [2, "Teacher", "Wizard Modal", "Step 2: Enters MRP, Offer Price, Validity & Live Schedule", "Computes instant discount savings %"],
    [3, "Teacher", "Wizard Modal", "Step 3: Attaches Multi-Docs (PDF/DOC) & Topic Mock Tests", "Populates studyMaterials & mockTests"],
    [4, "Wizard Modal", "Cloudinary", "Streams course banner file via Multer buffer", "Multi-region CDN image ingestion"],
    [5, "Cloudinary", "Wizard Modal", "Returns secure HTTPS URL and responsive variants", "Binds URL to thumbnail payload"],
    [6, "Wizard Modal", "TeacherCtrl", "Submits POST /api/teacher/courses with full JSON schema", "Authenticated payload dispatch"],
    [7, "TeacherCtrl", "TeacherCtrl", "Validates sub-arrays, formats questions, auto-slugifies title", "Pre-save schema validation hook"],
    [8, "TeacherCtrl", "Course DB", "Executes Course.create({ ...payload, instructor: teacherId })", "Document inserted and indexed"],
    [9, "Course DB", "TeacherCtrl", "Returns persisted course document with Mongo ObjectId", "Database transaction committed"],
    [10, "TeacherCtrl", "Wizard Modal", "Returns HTTP 201 Created { success: true, course }", "Triggers client notification toast"],
    [11, "Course DB", "Student Catalog", "Batch instantly surfaces in Browse Platform Courses catalog", "Live student visibility enabled"]
]
add_module_section(
    2,
    "Module 2: 3-Step Course Creation Wizard & Auto-Publish Sequence",
    "MODULE 2 SPECIFICATION",
    "The modern 3-step Course Creation Wizard enables teachers to define curriculum structure, pricing models, "
    "multi-format study material vaults (PDFs, Notes, E-Books with topic tags), and topic-wise mock tests with "
    "embedded MCQ questions. Upon submission, the course is automatically published to the student catalog.",
    diag2_path,
    steps_data_2,
    515, 230
)

# =============================================================
# PAGE 5: MODULE 3 (CLASSROOM MANAGEMENT)
# =============================================================
steps_data_3 = [
    [1, "Teacher", "Classroom UI", "Navigates to 'My Courses & Batches' tab", "Triggers course list fetch"],
    [2, "Classroom UI", "TeacherCtrl", "Dispatches GET /api/teacher/courses", "Includes educator auth bearer token"],
    [3, "TeacherCtrl", "MongoDB", "Executes Course.find({ instructor: teacherId }).sort({ createdAt: -1 })", "Fetches educator courses"],
    [4, "MongoDB", "TeacherCtrl", "Returns course objects with deliverable sub-documents", "Indexed by instructor ID"],
    [5, "TeacherCtrl", "Classroom UI", "Renders Course Cards with badge counters (PDFs, Tests, Lectures)", "Reactive UI card render"],
    [6, "Teacher", "Classroom UI", "Clicks 'Inspect Enrolled Students' button on specific batch", "Triggers student roster query"],
    [7, "Classroom UI", "TeacherCtrl", "Dispatches GET /api/teacher/courses/:courseId/students", "Requests roster for batch"],
    [8, "TeacherCtrl", "MongoDB", "Queries Enrollment records joining User profiles (Name, Mobile, State)", "Aggregates verified enrollment list"],
    [9, "MongoDB", "TeacherCtrl", "Returns enrolled student array with payment status", "Confirms verified learners"],
    [10, "TeacherCtrl", "Classroom UI", "Displays interactive roster table with learner details", "Client renders student table"],
    [11, "Teacher", "Meet / Stream", "Clicks '🔴 Start Live Class' button -> Launches Google Meet / Zoom", "Redirects to external classroom"]
]
add_module_section(
    3,
    "Module 3: Classroom Management & Enrolled Students Tracking Sequence",
    "MODULE 3 SPECIFICATION",
    "Educators manage their active batches, monitor enrolled students, inspect payment confirmations, "
    "and initiate live classroom broadcasts. The module offers deep visibility into student demographic distribution "
    "and direct links for scheduled lecture sessions.",
    diag3_path,
    steps_data_3,
    515, 230
)

# =============================================================
# PAGE 6: MODULE 4 (MCQ QUIZ BUILDER)
# =============================================================
steps_data_4 = [
    [1, "Teacher", "MCQ Builder", "Selects Subject, Grade/Board, Target State & Quiz Set Title", "Defines question taxonomy context"],
    [2, "Teacher", "MCQ Builder", "Inputs Question text, 4 Options, Correct Option Index (A-D) & Solution", "Client validates required inputs"],
    [3, "Teacher", "MCQ Builder", "Clicks '💾 Save Question to Bank' button", "Submits question payload"],
    [4, "MCQ Builder", "TeacherCtrl", "Dispatches POST /api/teacher/mcqs", "Sends question payload over HTTPS"],
    [5, "TeacherCtrl", "TeacherCtrl", "Validates option count === 4 and correctOption index bounds", "Prevents invalid exam formatting"],
    [6, "TeacherCtrl", "McqQuestion DB", "Executes McqQuestion.create({ ...data, educator: teacherId })", "Inserts question into repository"],
    [7, "McqQuestion DB", "TeacherCtrl", "Returns persisted question document with ID", "Document committed to database"],
    [8, "TeacherCtrl", "MCQ Builder", "Returns HTTP 201 Created { success: true, mcq }", "Triggers success feedback alert"],
    [9, "MCQ Builder", "Teacher", "Displays newly added question in 'Active Question Bank' list", "Question available for editing"],
    [10, "McqQuestion DB", "Student Quiz", "Question immediately available in Student Practice Assessment sets", "Live evaluation pool updated"]
]
add_module_section(
    4,
    "Module 4: Topic-Wise MCQ Quiz Builder & Set Creation Sequence",
    "MODULE 4 SPECIFICATION",
    "The MCQ Quiz Builder equips educators to author individual questions or batch import test papers. "
    "Each question encapsulates comprehensive metadata including target exam, grade level, topic categorization, "
    "four answer options, correct answer indicator, and faculty step-by-step explanatory notes.",
    diag4_path,
    steps_data_4,
    515, 230
)

# =============================================================
# PAGE 7: MODULE 5 (EXAM AUDIT & ANALYTICS)
# =============================================================
steps_data_5 = [
    [1, "Student", "Quiz Engine", "Student completes quiz assessment and submits answer sheet", "Student completes assessment"],
    [2, "Quiz Engine", "Quiz Engine", "Computes marks, percentage, passed/failed boolean & timing", "Automated scoring engine"],
    [3, "Quiz Engine", "McqAttempt DB", "Stores McqAttempt record (score, totalMarks, percentage, studentId)", "Audit record logged in database"],
    [4, "Teacher", "TeacherCtrl", "Educator opens 'MCQ Audit & Attempt Reports' tab", "Triggers audit records fetch"],
    [5, "TeacherCtrl", "McqAttempt DB", "Executes McqAttempt.find({ educatorCourses }).populate('student')", "Queries student submissions"],
    [6, "McqAttempt DB", "TeacherCtrl", "Returns attempts array with student profiles and scores", "Aggregates exam performance data"],
    [7, "TeacherCtrl", "Teacher", "Returns HTTP 200 { success: true, attempts: [...] }", "Sends report data to educator UI"],
    [8, "Teacher", "Teacher", "Educator reviews class pass percentage, top performers & struggle topics", "Informs pedagogical adjustments"]
]
add_module_section(
    5,
    "Module 5: Student Exam Audit & Analytics Sequence",
    "MODULE 5 SPECIFICATION",
    "The Exam Audit module tracks real-time student quiz performance across all authored test sets. "
    "Educators analyze student scorecards, percentage distributions, completion timestamps, and pass/fail ratios "
    "to identify curriculum bottlenecks and high-yield revision topics.",
    diag5_path,
    steps_data_5,
    515, 230
)

# =============================================================
# PAGE 8: MODULE 6 (ROYALTY PAYOUTS)
# =============================================================
steps_data_6 = [
    [1, "Teacher", "Payout UI", "Inspects Accumulated Course Sales Royalty Balance", "Educator checks earnings balance"],
    [2, "Payout UI", "TeacherCtrl", "Dispatches GET /api/teacher/stats (Checks wallet & earnings ledger)", "Queries royalty wallet status"],
    [3, "TeacherCtrl", "Payout UI", "Returns Available Withdrawable Balance (e.g. ₹48,500)", "Displays balance on payout panel"],
    [4, "Teacher", "Payout UI", "Enters desired Withdrawal Amount + Bank Account / IFSC / UPI ID", "Specifies payout destination"],
    [5, "Payout UI", "TeacherCtrl", "Dispatches POST /api/teacher/payouts/request (amount, bankDetails)", "Submits payout withdrawal request"],
    [6, "TeacherCtrl", "MongoDB", "Validates balance >= amount, creates PayoutRequest document (PENDING)", "Locks funds in escrow ledger"],
    [7, "MongoDB", "TeacherCtrl", "Returns created payout record with unique Transaction Ref ID", "Request queued for admin approval"],
    [8, "TeacherCtrl", "Payout UI", "Returns HTTP 200 'Payout Request Submitted for Processing'", "Displays confirmation banner"],
    [9, "Super Admin", "MongoDB", "Admin reviews pending request in Super Admin portal & executes transfer", "Disburses funds via bank/UPI"],
    [10, "MongoDB", "Payout UI", "Payout record status transitions from 'PENDING' to 'COMPLETED'", "Updates teacher ledger status"]
]
add_module_section(
    6,
    "Module 6: Teacher Royalty Earnings & Payout Withdrawal Sequence",
    "MODULE 6 SPECIFICATION",
    "Educators earn automated royalties on every student course enrollment. This module provides a transparent "
    "earnings ledger, withdrawal request mechanism with bank account / UPI routing, and status tracking through "
    "Super Admin financial verification and settlement.",
    diag6_path,
    steps_data_6,
    515, 230
)

doc.build(story, canvasmaker=NumberedCanvas)
print(f"✓ PDF successfully generated: {PDF_FILENAME}")
