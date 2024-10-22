pipeline {
    agent any

    environment {
        // Set up environment variables, such as Node.js version or paths
        NODE_VERSION = "14.x"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                // Install Node.js version using Node Version Manager (NVM) or similar
                sh 'nvm install $NODE_VERSION'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                // Run tests (adjust to your testing framework)
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                // Build the project (if needed)
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                // Add deployment steps (e.g., copy files, run Docker, etc.)
                // Adjust these steps based on your deployment method
                sh 'echo Deploying...'
            }
        }
    }

    post {
        always {
            // Optional: Send notifications, cleanup, etc.
            echo 'Pipeline finished.'
        }
        success {
            echo 'Build was successful!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
