# Documentation Guidelines for IT Asset Management System

## Project Documentation Structure

### Location
- **All `.md` files**: Store in `docs/` folder
- **Exception**: `README.md` stays in project root
- **Index file**: `docs/README.md` contains organized index of all documentation

### Current Documentation Categories

#### 1. Setup & Configuration
- `DATABASE_SETUP.md` - Database setup instructions
- `SUPABASE_SETUP.md` - Supabase configuration guide
- `SUPER_ADMIN_SETUP.md` - Super admin account setup
- `USER_MANAGEMENT_SETUP.md` - User management configuration

#### 2. Migration & Updates
- `MIGRATION_GUIDE.md` - General migration guidelines
- `ASSET_ASSIGNMENT_MIGRATION.md` - Asset assignment system migration

#### 3. Bug Fixes & Issues
- `ASSET_EDIT_FOREIGN_KEY_FIX.md` - Asset edit foreign key issues
- `ASSET_IMPORT_FIX_SUMMARY.md` - Asset import fixes
- `EMPLOYEE_CODE_TO_ID_FIX.md` - Employee code mapping fixes
- `EMPLOYEE_PRINT_ASSET_ISSUE_FIX.md` - Employee print functionality fixes
- `FOREIGN_KEY_CONSTRAINT_FIX.md` - Foreign key constraint issues
- `PROJECT_SAVE_FIX.md` - Project save functionality fixes

#### 4. Features & Enhancements
- `ASSET_PROJECT_DROPDOWN_FEATURE.md` - Asset project dropdown feature

#### 5. Technical Documentation
- `TECHNICAL_DOCUMENTATION.md` - Comprehensive technical documentation
- `SUPER_ADMIN_SCRIPTS_GUIDE.md` - Super admin scripts and utilities

## Naming Conventions

### File Naming Rules
- Use **UPPERCASE** for feature names and technical terms
- Use descriptive suffixes:
  - `_FIX.md` - Bug fixes and issue resolutions
  - `_SETUP.md` - Setup and configuration guides
  - `_GUIDE.md` - General guides and instructions
  - `_FEATURE.md` - New feature documentation
  - `_MIGRATION.md` - Migration and update documentation

### Examples
- `FEATURE_NAME_DESCRIPTION.md`
- `COMPONENT_NAME_FIX.md`
- `SYSTEM_NAME_SETUP.md`
- `FEATURE_NAME_MIGRATION.md`

## Documentation Template for New Features

When adding a new feature, create a documentation file following this template:

```markdown
# [Feature Name] - [Brief Description]

## Overview
Brief description of what the feature does and why it was implemented.

## Problem/Need
What problem does this feature solve or what need does it address?

## Solution
How the feature works and what it provides.

## Implementation Details

### Database Changes
- Any new tables, columns, or constraints
- Migration scripts created

### Code Changes
- Components modified/created
- Services updated
- API endpoints added/modified

### UI/UX Changes
- New pages or components
- User interface modifications
- User experience improvements

## Usage Instructions
How to use the feature from a user perspective.

## Technical Details
- Architecture decisions
- Performance considerations
- Security implications

## Testing
- How to test the feature
- Test cases covered
- Known limitations

## Future Enhancements
Potential improvements or extensions to the feature.

## Related Documentation
Links to related setup guides, fixes, or other features.
```

## When to Create Documentation

### Always Create Documentation For:
- ✅ New features or major enhancements
- ✅ Bug fixes that affect multiple components
- ✅ Database migrations or schema changes
- ✅ Setup or configuration changes
- ✅ API changes or new endpoints
- ✅ Security-related changes

### Documentation Categories by Type:

#### Feature Documentation (`_FEATURE.md`)
- New functionality added to the system
- UI/UX improvements
- New user workflows
- Integration with external systems

#### Fix Documentation (`_FIX.md`)
- Bug fixes affecting multiple components
- Performance improvements
- Data integrity fixes
- Security patches

#### Setup Documentation (`_SETUP.md`)
- Installation procedures
- Configuration guides
- Environment setup
- Deployment instructions

#### Migration Documentation (`_MIGRATION.md`)
- Database schema changes
- Data migration procedures
- System updates
- Breaking changes

## Maintenance Guidelines

### When Adding New Documentation:
1. **Create the `.md` file** in the `docs/` folder
2. **Use proper naming convention** (UPPERCASE with descriptive suffix)
3. **Update `docs/README.md`** to include the new file in the appropriate section
4. **Follow the template** structure for consistency
5. **Include cross-references** to related documentation

### When Modifying Existing Documentation:
1. **Update the relevant `.md` file**
2. **Update the index** in `docs/README.md` if the category changes
3. **Maintain consistency** with existing documentation style
4. **Add version/date information** for significant changes

## Quality Standards

### Content Requirements:
- Clear, concise descriptions
- Step-by-step instructions where applicable
- Code examples when relevant
- Screenshots for UI changes
- Links to related documentation

### Formatting Standards:
- Use proper markdown syntax
- Consistent heading structure
- Code blocks with language specification
- Bullet points for lists
- Tables for structured data

### Review Process:
- Technical accuracy verification
- Grammar and spelling check
- Link validation
- Template compliance
- Index update verification

## Integration with Development Workflow

### For New Features:
1. Plan the feature and its documentation needs
2. Create documentation file during development
3. Update documentation as implementation progresses
4. Finalize documentation before feature completion
5. Update index and cross-references

### For Bug Fixes:
1. Document the problem and solution
2. Include steps to reproduce and verify the fix
3. Note any related issues or considerations
4. Update relevant setup guides if configuration changes

This documentation system ensures that all project knowledge is properly organized, accessible, and maintainable for current and future team members.
