# -*- coding: utf-8 -*-

import os
import sys
import gzip
import boto3
import botocore
import mimetypes
import cStringIO


def gzip_data(data):
    out = None
    infile = cStringIO.StringIO()
    try:
        gzip_file = gzip.GzipFile(fileobj=infile, mode='w', compresslevel=5)
        gzip_file.write(data)
        gzip_file.close()
        infile.seek(0)
        out = infile.getvalue()
    except:
        out = None
    finally:
        infile.close()
    return out


def save_to_s3(s3, local_file, remote_file, bucket_name, mimetype):
    try:
        with open(local_file, 'r') as f:
            data = gzip_data(f.read())
    except Exception  as e:
        print('Failed to upload %s' % local_file)
        sys.exit(1)
    headers = {}
    headers['ACL'] = 'public-read'
    headers['ContentType'] = mimetype
    headers['CacheControl'] = 'no-cache'
    headers['ContentEncoding'] = 'gzip'

    try:
        print('Uploading %s to %s...' %(local_file, remote_file))
        s3.Object(bucket_name, remote_file).put(Body=data, **headers)
    except Exception as e:
        print(e)
        print('Error while uploading %s to %s...' %(local_file, remote_file))


def get_file_mimetype(local_file):
    mimetype, _ = mimetypes.guess_type(local_file)
    if mimetype:
        return mimetype
    return 'text/plain'


def upload(s3, base_dir, bucket_name, branch_name):
    s3_dir_path = 'vib/%s' % branch_name
    print('Destionation folder is:')
    print('%s' % s3_dir_path)
    upload_dirs = ['web-vib/vib/static', 'web-vib/vib/templates']
    for directory in upload_dirs:
        for file_path_list in os.walk(os.path.join(base_dir, directory)):
            file_names = [name for name in file_path_list[2] if '.mako.' not in name]
            for file_name in file_names:
                file_base_path = file_path_list[0]
                relative_file_path = file_base_path.replace(base_dir + '/', '')
                remote_file = s3_dir_path + relative_file_path.replace('web-vib/vib', '') + '/' + file_name
                local_file = os.path.join(file_base_path, file_name)
                mimetype = get_file_mimetype(local_file)
                save_to_s3(s3, local_file, remote_file, bucket_name, mimetype)
    print('Project uploaded to S3')
    print('')
    print('Try to open: https://mf-geoadmin3.int.bgdi.ch/%s/glmap.html' % s3_dir_path)


def init_connection(bucket_name, profile_name):
    try:
        session = boto3.session.Session(profile_name=profile_name)
    except botocore.exceptions.ProfileNotFound as e:
        print('You need to set PROFILE_NAME to a valid profile name in $HOME/.aws/credentials')
        print(e)
        sys.exit(1)
    except botocore.exceptions.BotoCoreError as e:
        print('Cannot establish connection. Check you credentials %s.' % profile_name)
        print(e)
        sys.exit(1)

    s3client = session.client('s3', config=boto3.session.Config(signature_version='s3v4'))
    s3 = session.resource('s3', config=boto3.session.Config(signature_version='s3v4'))

    bucket = s3.Bucket(bucket_name)
    return (s3, s3client, bucket)


def parse_arguments(argv):
    if len(argv) > 3:
        print('Too many arguments, aborting...')
        sys.exit(1)
    if len(argv) < 3:
        print('Not enough arguements, aborting...')
        sys.exit(1)

    base_dir = argv[1]
    branch_name = str(argv[2])
    bucket_name = os.environ.get('S3_MF_GEOADMIN3_INT')
    user = os.environ.get('USER')
    profile_name = '{}_aws_admin'.format(user)
    return base_dir, bucket_name, profile_name, branch_name


def main():
    print('Preparing upload...')
    base_dir, bucket_name, profile_name, branch_name = parse_arguments(sys.argv)
    s3, s3client, bucket = init_connection(bucket_name, profile_name)
    upload(s3, base_dir, bucket_name, branch_name)


if __name__ == '__main__':
    main()
