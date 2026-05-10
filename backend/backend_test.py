"""
Backend API Testing for PROOF™
Tests all major endpoints with proper authentication and RBAC
"""
import requests
import sys
from datetime import datetime

BASE_URL = "https://management-hub-23.preview.emergentagent.com/api"

class ProofAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 [{self.tests_run}] {name}")
        if description:
            print(f"   {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                print(f"❌ Failed - Unknown method {method}")
                self.failed_tests.append(name)
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(name)

            try:
                return success, response.json() if success else {}
            except:
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(name)
            return False, {}

    def login(self, email, password, role_name):
        """Login and store token"""
        print(f"\n{'='*60}")
        print(f"🔐 Logging in as {role_name} ({email})")
        print(f"{'='*60}")
        success, response = self.test(
            f"Login as {role_name}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            description=f"Authenticate {email}"
        )
        if success and 'access_token' in response:
            self.tokens[role_name] = response['access_token']
            print(f"✅ Token stored for {role_name}")
            return True
        print(f"❌ Login failed for {role_name}")
        return False

    def test_public_routes(self):
        """Test public routes (no auth required)"""
        print(f"\n{'='*60}")
        print("📄 TESTING PUBLIC ROUTES")
        print(f"{'='*60}")
        
        self.test("Health check", "GET", "health", 200, description="Check API health")
        self.test("Setup status", "GET", "auth/setup-status", 200, description="Check if owner exists")
        self.test("Sitemap.xml", "GET", "sitemap.xml", 200, description="Get sitemap")
        self.test("Robots.txt", "GET", "robots.txt", 200, description="Get robots.txt")
        self.test("Public settings", "GET", "admin/public-settings", 200, description="Get public site settings")

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print(f"\n{'='*60}")
        print("🔐 TESTING AUTHENTICATION")
        print(f"{'='*60}")
        
        # Login with different roles
        self.login("owner@proof.firm", "Proof2026!", "owner")
        self.login("admin@proof.firm", "Proof2026!", "admin")
        self.login("editor@proof.firm", "Proof2026!", "editor")
        self.login("strategist@proof.firm", "Proof2026!", "strategist")
        self.login("devon@member.proof", "Proof2026!", "member")
        
        # Test /me endpoint
        if 'owner' in self.tokens:
            self.test("Get current user (owner)", "GET", "auth/me", 200, token=self.tokens['owner'])

    def test_admin_dashboard(self):
        """Test admin dashboard and KPIs"""
        print(f"\n{'='*60}")
        print("📊 TESTING ADMIN DASHBOARD")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        # Get users
        success, users = self.test("List all users", "GET", "admin/users", 200, token=self.tokens['owner'])
        if success:
            print(f"   Found {len(users)} users")
        
        # Get athletes
        success, athletes = self.test("List athletes", "GET", "ops/athletes", 200, token=self.tokens['owner'])
        if success:
            print(f"   Found {len(athletes)} athletes")
            if len(athletes) < 6:
                print(f"   ⚠️  Expected >= 6 athletes, got {len(athletes)}")
        
        # Get documents
        success, docs = self.test("List documents", "GET", "ops/documents", 200, token=self.tokens['owner'])
        if success:
            print(f"   Found {len(docs)} documents")
            if len(docs) < 6:
                print(f"   ⚠️  Expected >= 6 documents, got {len(docs)}")

    def test_cms_pages(self):
        """Test CMS pages functionality"""
        print(f"\n{'='*60}")
        print("📝 TESTING CMS PAGES")
        print(f"{'='*60}")
        
        if 'editor' not in self.tokens:
            print("⚠️  Skipping - no editor token")
            return
        
        # List pages
        success, pages = self.test("List pages", "GET", "cms/pages", 200, token=self.tokens['editor'])
        if success:
            print(f"   Found {len(pages)} pages")
            if len(pages) < 3:
                print(f"   ⚠️  Expected >= 3 pages, got {len(pages)}")
            
            # Test getting a specific page
            if pages:
                page_id = pages[0]['id']
                self.test(f"Get page by ID", "GET", f"cms/pages/{page_id}", 200, token=self.tokens['editor'])
                
                # Test updating a page
                self.test(
                    "Update page",
                    "PATCH",
                    f"cms/pages/{page_id}",
                    200,
                    data={"title": pages[0]['title']},
                    token=self.tokens['editor']
                )

    def test_cms_posts(self):
        """Test CMS posts functionality"""
        print(f"\n{'='*60}")
        print("📰 TESTING CMS POSTS")
        print(f"{'='*60}")
        
        if 'editor' not in self.tokens:
            print("⚠️  Skipping - no editor token")
            return
        
        # List posts
        success, posts = self.test("List posts", "GET", "cms/posts", 200, token=self.tokens['editor'])
        if success:
            print(f"   Found {len(posts)} posts")
            if len(posts) < 3:
                print(f"   ⚠️  Expected >= 3 posts, got {len(posts)}")
            
            # Test getting a specific post
            if posts:
                post_id = posts[0]['id']
                self.test(f"Get post by ID", "POST", f"cms/posts", 200, 
                         data={"title": "Test Post", "slug": "test-post-" + datetime.now().strftime("%H%M%S")},
                         token=self.tokens['editor'])

    def test_cms_media(self):
        """Test media library"""
        print(f"\n{'='*60}")
        print("🖼️  TESTING MEDIA LIBRARY")
        print(f"{'='*60}")
        
        if 'editor' not in self.tokens:
            print("⚠️  Skipping - no editor token")
            return
        
        self.test("List media", "GET", "cms/media", 200, token=self.tokens['editor'])

    def test_cms_menus(self):
        """Test menus"""
        print(f"\n{'='*60}")
        print("🗂️  TESTING MENUS")
        print(f"{'='*60}")
        
        success, menus = self.test("List menus", "GET", "cms/menus", 200)
        if success:
            print(f"   Found {len(menus)} menus")
            if len(menus) < 4:
                print(f"   ⚠️  Expected 4 menus (header, footer_firm, footer_practices, footer_legal), got {len(menus)}")

    def test_roster(self):
        """Test roster management"""
        print(f"\n{'='*60}")
        print("👥 TESTING ROSTER")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        success, athletes = self.test("List athletes (roster)", "GET", "ops/athletes", 200, token=self.tokens['owner'])
        if success and len(athletes) >= 6:
            print(f"   ✅ Found {len(athletes)} athletes (expected >= 6)")

    def test_accounts(self):
        """Test accounts management"""
        print(f"\n{'='*60}")
        print("👤 TESTING ACCOUNTS")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        success, users = self.test("List users (accounts)", "GET", "admin/users", 200, token=self.tokens['owner'])
        if success:
            print(f"   Found {len(users)} users")
            # Test updating a user (non-owner)
            non_owner_users = [u for u in users if u['role'] != 'owner']
            if non_owner_users:
                user_id = non_owner_users[0]['id']
                self.test(
                    "Update user status",
                    "PATCH",
                    f"admin/users/{user_id}",
                    200,
                    data={"status": non_owner_users[0]['status']},
                    token=self.tokens['owner']
                )

    def test_invites(self):
        """Test invites system"""
        print(f"\n{'='*60}")
        print("✉️  TESTING INVITES")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        # List invites
        success, invites = self.test("List invites", "GET", "admin/invites", 200, token=self.tokens['owner'])
        
        # Create an invite
        test_email = f"test-invite-{datetime.now().strftime('%H%M%S')}@proof.firm"
        success, invite = self.test(
            "Create invite",
            "POST",
            "admin/invites",
            200,
            data={
                "email": test_email,
                "name": "Test Invite User",
                "role": "editor"
            },
            token=self.tokens['owner']
        )
        if success:
            print(f"   ✅ Invite created with token: {invite.get('token', 'N/A')[:20]}...")

    def test_audit_log(self):
        """Test audit log"""
        print(f"\n{'='*60}")
        print("📋 TESTING AUDIT LOG")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        success, logs = self.test("List audit logs", "GET", "admin/audit", 200, token=self.tokens['owner'])
        if success:
            print(f"   Found {len(logs)} audit log entries")
        
        # Test filtering
        self.test("Filter audit by resource_type", "GET", "admin/audit?resource_type=profile", 200, token=self.tokens['owner'])

    def test_analytics(self):
        """Test analytics"""
        print(f"\n{'='*60}")
        print("📈 TESTING ANALYTICS")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        success, analytics = self.test("Get analytics summary", "GET", "admin/analytics/summary", 200, token=self.tokens['owner'])
        if success:
            print(f"   Analytics data: {analytics.get('rolling_7d', {})}")

    def test_settings(self):
        """Test settings"""
        print(f"\n{'='*60}")
        print("⚙️  TESTING SETTINGS")
        print(f"{'='*60}")
        
        if 'owner' not in self.tokens:
            print("⚠️  Skipping - no owner token")
            return
        
        success, settings = self.test("Get settings", "GET", "admin/settings", 200, token=self.tokens['owner'])
        if success:
            # Test updating settings
            self.test(
                "Update settings",
                "PATCH",
                "admin/settings",
                200,
                data={"site_title": settings.get('site_title', 'PROOF')},
                token=self.tokens['owner']
            )

    def test_portal_member(self):
        """Test member portal endpoints"""
        print(f"\n{'='*60}")
        print("🏠 TESTING MEMBER PORTAL")
        print(f"{'='*60}")
        
        if 'member' not in self.tokens:
            print("⚠️  Skipping - no member token")
            return
        
        # Test portal/today
        success, today = self.test("Portal Today", "GET", "ops/portal/today", 200, token=self.tokens['member'])
        if success:
            print(f"   Next event: {today.get('next_event', {}).get('title', 'None')}")
            print(f"   Doc count: {today.get('doc_count', 0)}")
            print(f"   Unread messages: {today.get('unread_count', 0)}")
        
        # Test documents
        success, docs = self.test("Portal Documents", "GET", "ops/documents", 200, token=self.tokens['member'])
        if success:
            print(f"   Found {len(docs)} documents")
            # Test signed URL generation
            if docs:
                doc_id = docs[0]['id']
                success, signed = self.test(
                    "Get signed document URL",
                    "GET",
                    f"ops/documents/{doc_id}/signed-url",
                    200,
                    token=self.tokens['member']
                )
                if success:
                    print(f"   ✅ Signed URL generated: {signed.get('url', 'N/A')[:50]}...")
        
        # Test calendar/events
        success, events = self.test("Portal Calendar", "GET", "ops/events", 200, token=self.tokens['member'])
        if success:
            print(f"   Found {len(events)} events")
        
        # Test messages/threads
        success, threads = self.test("Portal Messages", "GET", "ops/threads", 200, token=self.tokens['member'])
        if success:
            print(f"   Found {len(threads)} message threads")
        
        # Test announcements
        success, news = self.test("Portal News", "GET", "ops/announcements", 200, token=self.tokens['member'])
        if success:
            print(f"   Found {len(news)} announcements")

    def test_contact_inquiry(self):
        """Test public contact form"""
        print(f"\n{'='*60}")
        print("📧 TESTING CONTACT INQUIRY")
        print(f"{'='*60}")
        
        test_email = f"test-{datetime.now().strftime('%H%M%S')}@example.com"
        self.test(
            "Submit inquiry",
            "POST",
            "ops/inquiries",
            200,
            data={
                "first_name": "Test",
                "last_name": "User",
                "email": test_email,
                "inquiring_as": "athlete",
                "message": "This is a test inquiry from automated testing."
            }
        )

    def test_rbac(self):
        """Test RBAC - member should not access admin"""
        print(f"\n{'='*60}")
        print("🔒 TESTING RBAC")
        print(f"{'='*60}")
        
        if 'member' not in self.tokens:
            print("⚠️  Skipping - no member token")
            return
        
        # Member should NOT be able to access admin endpoints
        self.test(
            "Member accessing admin users (should fail)",
            "GET",
            "admin/users",
            403,
            token=self.tokens['member'],
            description="Member should be forbidden from admin endpoints"
        )
        
        self.test(
            "Member accessing admin settings (should fail)",
            "GET",
            "admin/settings",
            403,
            token=self.tokens['member'],
            description="Member should be forbidden from settings"
        )

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print("📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        return 0 if self.tests_passed == self.tests_run else 1


def main():
    print("="*60)
    print("PROOF™ Backend API Testing")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    tester = ProofAPITester()
    
    # Run all test suites
    tester.test_public_routes()
    tester.test_auth_flow()
    tester.test_admin_dashboard()
    tester.test_cms_pages()
    tester.test_cms_posts()
    tester.test_cms_media()
    tester.test_cms_menus()
    tester.test_roster()
    tester.test_accounts()
    tester.test_invites()
    tester.test_audit_log()
    tester.test_analytics()
    tester.test_settings()
    tester.test_portal_member()
    tester.test_contact_inquiry()
    tester.test_rbac()
    
    return tester.print_summary()


if __name__ == "__main__":
    sys.exit(main())
