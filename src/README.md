# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teachers can sign up and unregister students after logging in
- Students and visitors can view activities and their participants

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Configure the teacher account and session signing secret in the environment. Do not commit these values:

   ```
   export TEACHER_USERNAME=teacher
   export TEACHER_PASSWORD='use-a-unique-strong-password'
   export SESSION_SECRET="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
   ```

   Keep the same `SESSION_SECRET` between server restarts so existing teacher sessions remain valid.

3. Run the application:

   ```
   uvicorn app:app --app-dir src --reload
   ```

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc
   - Activities website: http://localhost:8000

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities and their current participants (public)          |
| GET    | `/auth/me`                                                        | Get the current teacher login status                                |
| POST   | `/auth/login`                                                     | Log in with the configured teacher username and password            |
| DELETE | `/auth/logout`                                                    | Log out the current teacher                                         |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up a student (teacher login required)                          |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher login required)                    |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
