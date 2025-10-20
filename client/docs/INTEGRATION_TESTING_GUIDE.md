# Integration Testing Guide

This guide provides comprehensive testing procedures for the Salini AMS frontend-backend integration.

## Prerequisites

### Backend API
- ✅ Backend API running on `http://localhost:5000`
- ✅ Database seeded with test data
- ✅ Swagger UI accessible at `http://localhost:5000`

### Frontend
- ✅ Frontend running on `http://localhost:3000`
- ✅ All dependencies installed
- ✅ No linting errors

## Test Scenarios

### 1. Authentication Flow

#### 1.1 Login Test
**URL**: `http://localhost:3000/login`

**Test Steps**:
1. Navigate to login page
2. Enter valid credentials:
   - Email: `admin@salini.com`
   - Password: `Admin@123`
3. Click "Sign In"
4. Verify redirect to dashboard
5. Check JWT token stored in localStorage

**Expected Results**:
- ✅ Successful login
- ✅ JWT token received and stored
- ✅ Redirect to dashboard
- ✅ User context updated

#### 1.2 Invalid Login Test
**Test Steps**:
1. Enter invalid credentials
2. Click "Sign In"

**Expected Results**:
- ❌ Login fails
- ✅ Error message displayed
- ✅ User remains on login page

#### 1.3 Logout Test
**Test Steps**:
1. Login successfully
2. Click logout button
3. Verify logout

**Expected Results**:
- ✅ JWT token removed from localStorage
- ✅ Redirect to login page
- ✅ User context cleared

### 2. Employee Management

#### 2.1 Employee List
**URL**: `http://localhost:3000/employees`

**Test Steps**:
1. Navigate to employees page
2. Verify employee list loads
3. Test pagination
4. Test search functionality
5. Test project filtering

**Expected Results**:
- ✅ Employee list displays
- ✅ Pagination works
- ✅ Search filters results
- ✅ Project filter works

#### 2.2 Create Employee
**Test Steps**:
1. Click "Add Employee" button
2. Fill in employee form:
   - Employee Code: `EMP001`
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@salini.com`
   - Department: Select from dropdown
   - Position: Select from dropdown
3. Click "Save"

**Expected Results**:
- ✅ Employee created successfully
- ✅ Success message displayed
- ✅ Employee appears in list
- ✅ Form closes

#### 2.3 Edit Employee
**Test Steps**:
1. Click edit button on an employee
2. Modify employee details
3. Click "Save"

**Expected Results**:
- ✅ Employee updated successfully
- ✅ Changes reflected in list
- ✅ Success message displayed

#### 2.4 Delete Employee
**Test Steps**:
1. Click delete button on an employee
2. Confirm deletion

**Expected Results**:
- ✅ Employee deleted successfully
- ✅ Employee removed from list
- ✅ Success message displayed

### 3. Asset Management

#### 3.1 Asset List
**URL**: `http://localhost:3000/assets`

**Test Steps**:
1. Navigate to assets page
2. Verify asset list loads
3. Test filtering by status
4. Test filtering by condition
5. Test assigned/unassigned filter

**Expected Results**:
- ✅ Asset list displays
- ✅ All filters work correctly
- ✅ Pagination functions

#### 3.2 Create Asset
**Test Steps**:
1. Click "Add Asset" button
2. Fill in asset form:
   - Asset Tag: `AST001`
   - Asset Name: `Laptop Dell`
   - Category: Select from dropdown
   - Status: `Available`
   - Condition: `Good`
3. Click "Save"

**Expected Results**:
- ✅ Asset created successfully
- ✅ Asset appears in list
- ✅ Success message displayed

#### 3.3 Assign Asset
**Test Steps**:
1. Click "Assign" button on an asset
2. Select employee from dropdown
3. Add assignment notes
4. Click "Assign"

**Expected Results**:
- ✅ Asset assigned successfully
- ✅ Asset status changes to "Assigned"
- ✅ Assignment appears in employee's assets

### 4. SIM Card Management

#### 4.1 SIM Card List
**URL**: `http://localhost:3000/sim-cards`

**Test Steps**:
1. Navigate to SIM cards page
2. Verify SIM card list loads
3. Test project filtering
4. Test refresh functionality

**Expected Results**:
- ✅ SIM card list displays
- ✅ Project filter works
- ✅ Refresh updates data

#### 4.2 Create SIM Card
**Test Steps**:
1. Click "Add SIM Card" button
2. Fill in SIM card form:
   - Phone Number: `+971501234567`
   - Provider: Select from dropdown
   - Plan: Select from dropdown
   - Project: Select from dropdown
3. Click "Save"

**Expected Results**:
- ✅ SIM card created successfully
- ✅ SIM card appears in list
- ✅ Success message displayed

### 5. Software License Management

#### 5.1 Software License List
**URL**: `http://localhost:3000/software-licenses`

**Test Steps**:
1. Navigate to software licenses page
2. Verify license list loads
3. Test expiry tracking
4. Test statistics display
5. Test export functionality

**Expected Results**:
- ✅ License list displays
- ✅ Expiry warnings shown
- ✅ Statistics accurate
- ✅ Export works

#### 5.2 Create Software License
**Test Steps**:
1. Click "Add License" button
2. Fill in license form:
   - Software Name: `Microsoft Office`
   - License Key: `XXXXX-XXXXX-XXXXX`
   - Expiry Date: Future date
   - Project: Select from dropdown
3. Click "Save"

**Expected Results**:
- ✅ License created successfully
- ✅ License appears in list
- ✅ Success message displayed

### 6. Reports

#### 6.1 Reports Dashboard
**URL**: `http://localhost:3000/reports`

**Test Steps**:
1. Navigate to reports page
2. Verify report list loads
3. Test report navigation
4. Test report filtering

**Expected Results**:
- ✅ Report list displays
- ✅ All reports accessible
- ✅ Filters work correctly

#### 6.2 Asset Allocation Report
**Test Steps**:
1. Click on "Asset Allocation Report"
2. Test filtering options
3. Test search functionality
4. Test CSV export
5. Test print functionality

**Expected Results**:
- ✅ Report data loads
- ✅ Filters work
- ✅ Search functions
- ✅ Export generates file
- ✅ Print opens dialog

### 7. User Management

#### 7.1 User List
**URL**: `http://localhost:3000/user-management`

**Test Steps**:
1. Navigate to user management page
2. Verify user list loads
3. Test role filtering
4. Test status filtering
5. Test search functionality

**Expected Results**:
- ✅ User list displays
- ✅ All filters work
- ✅ Search functions
- ✅ Pagination works

#### 7.2 Create User
**Test Steps**:
1. Click "Add User" button
2. Fill in user form:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `jane.smith@salini.com`
   - Role: `User`
   - Department: Select from dropdown
3. Click "Save"

**Expected Results**:
- ✅ User created successfully
- ✅ User appears in list
- ✅ Success message displayed

### 8. Error Handling

#### 8.1 Network Error Handling
**Test Steps**:
1. Disconnect internet
2. Try to perform any API operation
3. Reconnect internet
4. Verify recovery

**Expected Results**:
- ✅ Offline message displayed
- ✅ Operations fail gracefully
- ✅ Recovery works automatically

#### 8.2 API Error Handling
**Test Steps**:
1. Try to create duplicate employee
2. Try to access unauthorized resource
3. Try invalid form data

**Expected Results**:
- ✅ Appropriate error messages
- ✅ User-friendly feedback
- ✅ No application crashes

### 9. Performance Testing

#### 9.1 Large Dataset Handling
**Test Steps**:
1. Load pages with large datasets
2. Test pagination performance
3. Test search performance
4. Test filter performance

**Expected Results**:
- ✅ Pages load within 3 seconds
- ✅ Pagination responsive
- ✅ Search results fast
- ✅ Filters responsive

#### 9.2 Memory Usage
**Test Steps**:
1. Navigate between pages multiple times
2. Monitor memory usage
3. Check for memory leaks

**Expected Results**:
- ✅ No memory leaks
- ✅ Memory usage stable
- ✅ No performance degradation

## Test Data Requirements

### Master Data
- ✅ Companies
- ✅ Cost Centers
- ✅ Nationalities
- ✅ Departments
- ✅ Sub Departments
- ✅ Employee Categories
- ✅ Employee Positions
- ✅ Item Categories
- ✅ Items
- ✅ Projects
- ✅ Sim Providers
- ✅ Sim Types
- ✅ Sim Card Plans
- ✅ Suppliers

### Test Users
- ✅ Super Admin: `admin@salini.com` / `Admin@123`
- ✅ Admin User: `admin.user@salini.com` / `Admin@123`
- ✅ Regular User: `user@salini.com` / `User@123`

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile Responsiveness
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

## Security Testing

### Authentication
- ✅ JWT token validation
- ✅ Token expiration handling
- ✅ Secure token storage
- ✅ Logout functionality

### Authorization
- ✅ Role-based access control
- ✅ Permission-based access
- ✅ Unauthorized access prevention

### Data Validation
- ✅ Input sanitization
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ SQL injection prevention

## Performance Benchmarks

### Page Load Times
- ✅ Login page: < 2 seconds
- ✅ Dashboard: < 3 seconds
- ✅ List pages: < 3 seconds
- ✅ Form pages: < 2 seconds

### API Response Times
- ✅ Authentication: < 1 second
- ✅ CRUD operations: < 2 seconds
- ✅ Search operations: < 3 seconds
- ✅ Report generation: < 5 seconds

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Symptoms**: Network errors in browser console
**Solution**: Check backend CORS configuration

#### 2. Authentication Failures
**Symptoms**: 401 errors, redirect to login
**Solution**: Verify JWT token and backend authentication

#### 3. Data Not Loading
**Symptoms**: Empty lists, loading spinners
**Solution**: Check API endpoints and database connection

#### 4. Form Validation Errors
**Symptoms**: Forms not submitting
**Solution**: Check validation rules and error handling

### Debug Tools

#### Browser Developer Tools
- Network tab for API calls
- Console for error messages
- Application tab for localStorage
- Performance tab for timing

#### Backend Logs
- Check API logs for errors
- Verify database queries
- Monitor authentication flow

## Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

Authentication Flow:
- [ ] Login successful
- [ ] Logout successful
- [ ] Invalid login handled

Employee Management:
- [ ] List loads
- [ ] Create employee
- [ ] Edit employee
- [ ] Delete employee

Asset Management:
- [ ] List loads
- [ ] Create asset
- [ ] Assign asset
- [ ] Filter assets

SIM Card Management:
- [ ] List loads
- [ ] Create SIM card
- [ ] Filter by project

Software License Management:
- [ ] List loads
- [ ] Create license
- [ ] Expiry tracking

Reports:
- [ ] Reports load
- [ ] Export works
- [ ] Print works

User Management:
- [ ] List loads
- [ ] Create user
- [ ] Role management

Error Handling:
- [ ] Network errors
- [ ] API errors
- [ ] Form validation

Performance:
- [ ] Page load times
- [ ] API response times
- [ ] Memory usage

Overall Result: [ ] PASS [ ] FAIL
Notes: ___________
```

## Continuous Integration

### Automated Tests
- Unit tests for components
- Integration tests for API calls
- E2E tests for user flows
- Performance tests for benchmarks

### Test Environment
- Staging environment for testing
- Test database with sample data
- Automated deployment pipeline
- Regular regression testing

This comprehensive testing guide ensures the Salini AMS system is thoroughly tested and ready for production use.
