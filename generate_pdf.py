import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' 
    along with custom header and footer styling.
    """
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
        self.saveState()
        
        # Primary colors
        primary_color = colors.HexColor('#0F172A')
        teal_color = colors.HexColor('#0D9488')
        gray_text = colors.HexColor('#64748B')
        border_color = colors.HexColor('#E2E8F0')

        # Top Accent Line
        self.setFillColor(teal_color)
        self.rect(0, 11 * 72 - 6, 8.5 * 72, 6, fill=True, stroke=False)

        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(primary_color)
            self.drawString(54, 11 * 72 - 25, "BITEBUDDY")
            self.setFont("Helvetica", 8)
            self.setFillColor(gray_text)
            self.drawString(110, 11 * 72 - 25, "|   Executive Architecture & Feature Summary")
            
            self.setStrokeColor(border_color)
            self.setLineWidth(0.5)
            self.line(54, 11 * 72 - 30, 8.5 * 72 - 54, 11 * 72 - 30)

        # Footer (All Pages)
        self.setStrokeColor(border_color)
        self.setLineWidth(0.5)
        self.line(54, 45, 8.5 * 72 - 54, 45)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(teal_color)
        self.drawString(54, 30, "CONFIDENTIAL & PROPRIETARY")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(gray_text)
        self.drawString(220, 30, "Prepared for Executive Review")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 30, page_str)

        self.restoreState()


def create_executive_pdf(output_filename="BiteBuddy_Executive_Overview.pdf"):
    # Target 2 Pages
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=40,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Color Palette Definition
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_secondary = colors.HexColor("#1E293B")  # Slate 800
    c_teal = colors.HexColor("#0D9488")       # Teal 600
    c_teal_light = colors.HexColor("#F0FDF4") # Mint light background
    c_accent = colors.HexColor("#2563EB")     # Blue 600
    c_dark = colors.HexColor("#334155")       # Slate 700
    c_muted = colors.HexColor("#64748B")      # Slate 500
    c_bg_light = colors.HexColor("#F8FAFC")   # Slate 50

    # Custom Typography Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        spaceAfter=2
    )

    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_teal,
        spaceAfter=12
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=6
    )

    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=6
    )

    style_bullet = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        leftIndent=10,
        spaceAfter=4
    )

    style_bold = ParagraphStyle(
        'BoldInline',
        parent=style_body,
        fontName='Helvetica-Bold'
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_dark
    )

    style_table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_primary
    )

    story = []

    # ==========================================
    # PAGE 1: EXECUTIVE OVERVIEW & PLATFORM MODULES
    # ==========================================

    # Document Header Banner
    story.append(Paragraph("BiteBuddy: AI Personal Health & Nutrition Platform", style_title))
    story.append(Paragraph("EXECUTIVE PRODUCT & ARCHITECTURE OVERVIEW", style_subtitle))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_teal, spaceBefore=0, spaceAfter=10))

    # Executive Summary Hero Card
    exec_summary_html = (
        "<b>BiteBuddy</b> is an end-to-end, intelligent health and nutrition ecosystem designed to revolutionize "
        "personal wellness. By coupling multi-modal <b>Google Gemini AI vision models</b> with real-time macro tracking, "
        "personalized meal generation, and interactive fitness logging, BiteBuddy eliminates manual calorie counting "
        "and delivers an intuitive, frictionless user experience."
    )
    
    metrics_table_data = [
        [
            Paragraph("<b>AI Vision Scanner</b><br/><font color='#64748B' size='7.5'>Instant Food Recognition & Macro Breakdown</font>", style_body),
            Paragraph("<b>Full-Stack Solution</b><br/><font color='#64748B' size='7.5'>React 18 SPA + Node/Express REST API</font>", style_body),
            Paragraph("<b>360° Tracking</b><br/><font color='#64748B' size='7.5'>Meals, Water, Workouts & Shopping Lists</font>", style_body)
        ]
    ]
    metrics_table = Table(metrics_table_data, colWidths=[165, 170, 169])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))

    hero_card_data = [
        [Paragraph(exec_summary_html, style_body)],
        [Spacer(1, 4)],
        [metrics_table]
    ]
    hero_card = Table(hero_card_data, colWidths=[504])
    hero_card.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(hero_card)
    story.append(Spacer(1, 10))

    # Core Features & Modules
    story.append(Paragraph("Key Capabilities & Module Breakdown", style_h1))

    modules_data = [
        [
            Paragraph("Feature Module", style_table_header),
            Paragraph("Core Functionality & Technological Capability", style_table_header),
            Paragraph("Business & User Value", style_table_header)
        ],
        [
            Paragraph("<b>AI Visual Meal Scanner</b>", style_table_cell_bold),
            Paragraph("Powered by <b>Google Gemini 1.5/2.0 Vision API</b>. Users snap a meal photo; the backend identifies food items, portion sizes, calories, and macros (protein, carbs, fat, fiber).", style_table_cell),
            Paragraph("Replaces tedious manual searching with 1-click visual recognition.", style_table_cell)
        ],
        [
            Paragraph("<b>Smart Meal Planner & Grocery AI</b>", style_table_cell_bold),
            Paragraph("Generates customized 7-day meal plans based on user targets (weight loss, muscle gain). Automatically syncs needed ingredients into an interactive <b>Smart Shopping List</b>.", style_table_cell),
            Paragraph("Saves planning time and streamlines grocery store trips.", style_table_cell)
        ],
        [
            Paragraph("<b>Conversational AI Health Coach</b>", style_table_cell_bold),
            Paragraph("Integrated chatbot utilizing specialized prompt engineering. Answers user queries on nutrition science, meal substitutes, and customized workout adjustments.", style_table_cell),
            Paragraph("Delivers 24/7 hyper-personalized expert guidance.", style_table_cell)
        ],
        [
            Paragraph("<b>360° Health Tracker & Analytics</b>", style_table_cell_bold),
            Paragraph("Tracks net calories (Consumed vs. Burned), hydration levels, workout logs, and weekly progress with dynamic SVG rings and chart visualizations.", style_table_cell),
            Paragraph("Provides clear feedback loops to keep users motivated.", style_table_cell)
        ]
    ]

    modules_table = Table(modules_data, colWidths=[120, 244, 140])
    modules_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(modules_table)
    story.append(Spacer(1, 10))

    # Architecture & Technology Stack Table
    story.append(Paragraph("System Architecture & Technology Stack", style_h1))

    arch_data = [
        [
            Paragraph("Layer", style_table_header),
            Paragraph("Technologies Used", style_table_header),
            Paragraph("Architectural Role & Highlights", style_table_header)
        ],
        [
            Paragraph("<b>Frontend SPA</b>", style_table_cell_bold),
            Paragraph("React 18, Vite, Lucide Icons, Custom CSS System", style_table_cell),
            Paragraph("Responsive glassmorphism UI, client-side routing, optimistic UI updates, mobile navigation.", style_table_cell)
        ],
        [
            Paragraph("<b>Backend REST API</b>", style_table_cell_bold),
            Paragraph("Node.js, Express.js, JWT Auth, Mongoose ODM", style_table_cell),
            Paragraph("Secure user authentication, CRUD operations for logs/plans, analytics calculation service.", style_table_cell)
        ],
        [
            Paragraph("<b>Database</b>", style_table_cell_bold),
            Paragraph("MongoDB Atlas / Local MongoDB", style_table_cell),
            Paragraph("Document storage for Users, Profiles, Meal Logs, Meal Plans, Workout Logs, and Water Intake.", style_table_cell)
        ],
        [
            Paragraph("<b>AI Services Layer</b>", style_table_cell_bold),
            Paragraph("Python, Google Gemini API, PIL, Pydantic", style_table_cell),
            Paragraph("Microservices for image recognition, prompt parsing, and adaptive diet recommendation logic.", style_table_cell)
        ]
    ]

    arch_table = Table(arch_data, colWidths=[110, 160, 234])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_teal),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(arch_table)

    story.append(PageBreak())

    # ==========================================
    # PAGE 2: DATA FLOW, BUSINESS VALUE & ROADMAP
    # ==========================================

    story.append(Paragraph("AI Processing Pipeline & Data Flow", style_h1))

    # Pipeline Flow Chart Table
    flow_data = [
        [
            Paragraph("<b>Step 1: Capture</b>", style_table_cell_bold),
            Paragraph("User uploads or takes meal photo in the React frontend app.", style_table_cell)
        ],
        [
            Paragraph("<b>Step 2: Transmission</b>", style_table_cell_bold),
            Paragraph("Image is securely payloaded to Express API & passed to Python AI Engine.", style_table_cell)
        ],
        [
            Paragraph("<b>Step 3: Vision Analysis</b>", style_table_cell_bold),
            Paragraph("Google Gemini Vision API parses food items, portion size, and computes calories & macros.", style_table_cell)
        ],
        [
            Paragraph("<b>Step 4: Persistence</b>", style_table_cell_bold),
            Paragraph("Parsed JSON structure is validated and stored in MongoDB under user's MealLog model.", style_table_cell)
        ],
        [
            Paragraph("<b>Step 5: Analytics Sync</b>", style_table_cell_bold),
            Paragraph("Dashboard UI instantly updates Macro Ring, Calorie Balance, and Net Energy progress.", style_table_cell)
        ]
    ]
    flow_table = Table(flow_data, colWidths=[130, 374])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), c_bg_light),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 10))

    # Business Impact & Value Proposition Box
    story.append(Paragraph("Executive Value Proposition & Key Differentiators", style_h1))

    value_points = [
        "<b>Zero Friction Logging:</b> Eliminates the #1 reason users abandon health apps (manual food database entry) by delivering single-tap AI visual detection.",
        "<b>Holistic Wellness Integration:</b> Combines diet, hydration, workouts, and grocery shopping into a unified workflow, eliminating the need for multiple disconnected apps.",
        "<b>Enterprise-Ready Security & Reliability:</b> JWT-authenticated endpoints, structured schema validation, error resilience, and responsive cross-device layout.",
        "<b>Highly Scalable Cloud Architecture:</b> Decoupled REST services allow seamless scaling of AI vision endpoints independently from core database workloads."
    ]

    for pt in value_points:
        story.append(Paragraph(f"• {pt}", style_bullet))

    story.append(Spacer(1, 10))

    # Security & Data Integrity Highlights
    story.append(Paragraph("Security, Quality & Compliance Measures", style_h1))

    security_data = [
        [
            Paragraph("Security & Auth", style_table_header),
            Paragraph("Data Integrity & Validation", style_table_header),
            Paragraph("User Experience & Design", style_table_header)
        ],
        [
            Paragraph("• JWT Stateless Authentication<br/>• Encrypted Password Hashing<br/>• Protected Express Middleware", style_table_cell),
            Paragraph("• Mongoose Strict Schema Constraints<br/>• Fallback Handlers for API timeouts<br/>• Environment Variable protection", style_table_cell),
            Paragraph("• Mobile-First Responsive Layout<br/>• Custom Dark Mode Aesthetic<br/>• Accessible Micro-animations", style_table_cell)
        ]
    ]
    security_table = Table(security_data, colWidths=[168, 168, 168])
    security_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_secondary),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0,1), (-1,1), colors.white),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(security_table)
    story.append(Spacer(1, 10))

    # Roadmap & Future Expansion
    story.append(Paragraph("Strategic Future Roadmap", style_h1))

    roadmap_html = (
        "<b>Phase 1 (Current):</b> Full Core Launch — AI Visual Meal Scanner, Smart Meal & Grocery Planner, AI Health Coach, Workout & Water Tracking.<br/>"
        "<b>Phase 2 (Near-Term):</b> Wearable Device Syncing (Apple Health, Fitbit), Real-Time Barcode Scanner, Social Community Feed.<br/>"
        "<b>Phase 3 (Long-Term):</b> Predictive Health Risk Modeling, Automated Micronutrient Deficit Warnings, B2B Enterprise Corporate Wellness Portal."
    )
    roadmap_card = Table([[Paragraph(roadmap_html, style_body)]], colWidths=[504])
    roadmap_card.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_teal_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#99F6E4')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(roadmap_card)
    story.append(Spacer(1, 12))

    # Project Status Sign-off Box
    signoff_data = [
        [
            Paragraph("<b>Project Status:</b> <font color='#0D9488'>STABLE / PRODUCTION READY</font>", style_body),
            Paragraph("<b>Repository:</b> <font color='#2563EB'>BiteBuddy (Main Branch)</font>", style_body),
            Paragraph("<b>Version:</b> 1.0.0 Enterprise", style_body)
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[180, 204, 120])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(signoff_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated: {output_filename}")

if __name__ == "__main__":
    create_executive_pdf()
